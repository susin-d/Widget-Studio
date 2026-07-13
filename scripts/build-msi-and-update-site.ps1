[CmdletBinding()]
param(
    [switch]$SkipDesktopBuild,
    [switch]$SkipWebsiteBuild
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$desktopDir = Join-Path $repoRoot "desktop"
$websiteDir = Join-Path $repoRoot "website"
$tauriConfigPath = Join-Path $desktopDir "src-tauri\tauri.conf.json"
$msiOutputDir = Join-Path $desktopDir "src-tauri\target\release\bundle\msi"
$sitePublicDir = Join-Path $websiteDir "public"
$siteMsiPath = Join-Path $sitePublicDir "WidgetStudioInstaller.msi"
$siteMetadataPath = Join-Path $sitePublicDir "installer.json"

function Test-MsiFile {
    param([Parameter(Mandatory)][string]$Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        return $false
    }

    $stream = [System.IO.File]::OpenRead($Path)
    try {
        $header = New-Object byte[] 8
        $read = $stream.Read($header, 0, $header.Length)
        $signature = ($header | ForEach-Object { $_.ToString("X2") }) -join ""
        return $read -eq 8 -and $signature -eq "D0CF11E0A1B11AE1"
    }
    finally {
        $stream.Dispose()
    }
}

function Invoke-NpmScript {
    param(
        [Parameter(Mandatory)][string]$WorkingDirectory,
        [Parameter(Mandatory)][string[]]$Arguments,
        [Parameter(Mandatory)][string]$Description
    )

    $exitCode = 0
    Write-Host "`n$Description" -ForegroundColor Cyan
    Push-Location $WorkingDirectory
    try {
        & npm @Arguments
        $exitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }

    if ($exitCode -ne 0) {
        throw "$Description failed with exit code $exitCode."
    }
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm was not found on PATH. Install Node.js 20+ and try again."
}

$tauriConfig = Get-Content -LiteralPath $tauriConfigPath -Raw | ConvertFrom-Json
$version = [string]$tauriConfig.version
$productName = [string]$tauriConfig.productName

if ([string]::IsNullOrWhiteSpace($version)) {
    throw "No version was found in $tauriConfigPath."
}

if (-not $SkipDesktopBuild) {
    $buildStartedAtUtc = [DateTime]::UtcNow
    $buildExitCode = 0

    Write-Host "`nBuilding Widget Studio MSI v$version..." -ForegroundColor Cyan
    Push-Location $desktopDir
    try {
        & npm run tauri:build -- --bundles msi
        $buildExitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }

    $freshMsi = @(
        Get-ChildItem -LiteralPath $msiOutputDir -Filter "*.msi" -File -ErrorAction SilentlyContinue |
            Where-Object {
                $_.LastWriteTimeUtc -ge $buildStartedAtUtc.AddSeconds(-2) -and (Test-MsiFile $_.FullName)
            }
    )

    if ($freshMsi.Count -eq 0) {
        throw "MSI build did not produce a fresh, valid MSI in $msiOutputDir. Exit code: $buildExitCode."
    }

    if ($buildExitCode -ne 0) {
        Write-Warning "Tauri returned exit code $buildExitCode after producing a fresh MSI; continuing with the verified artifact."
    }
}

$msiCandidates = @()
if ($SkipDesktopBuild) {
    $msiCandidates = @(
        Get-ChildItem -LiteralPath $msiOutputDir -Filter "*.msi" -File -ErrorAction SilentlyContinue |
            Where-Object { Test-MsiFile $_.FullName } |
            Sort-Object LastWriteTimeUtc -Descending
    )
}
else {
    $msiCandidates = @($freshMsi)
}

if ($msiCandidates.Count -eq 0) {
    throw "No valid MSI was found in $msiOutputDir. Run the desktop build first or remove -SkipDesktopBuild."
}

$sourceMsi = $msiCandidates[0]
New-Item -ItemType Directory -Path $sitePublicDir -Force | Out-Null

$temporaryMsiPath = Join-Path $sitePublicDir ".WidgetStudioInstaller.$PID.tmp"
try {
    Copy-Item -LiteralPath $sourceMsi.FullName -Destination $temporaryMsiPath -Force
    if (-not (Test-MsiFile $temporaryMsiPath)) {
        throw "The copied MSI failed signature validation."
    }
    Move-Item -LiteralPath $temporaryMsiPath -Destination $siteMsiPath -Force
}
finally {
    if (Test-Path -LiteralPath $temporaryMsiPath) {
        Remove-Item -LiteralPath $temporaryMsiPath -Force
    }
}

$publishedMsi = Get-Item -LiteralPath $siteMsiPath
$sha256 = (Get-FileHash -LiteralPath $siteMsiPath -Algorithm SHA256).Hash.ToLowerInvariant()
$metadata = [ordered]@{
    productName = $productName
    version = $version
    fileName = $publishedMsi.Name
    downloadUrl = "/$($publishedMsi.Name)"
    sizeBytes = $publishedMsi.Length
    sha256 = $sha256
    generatedAtUtc = [DateTime]::UtcNow.ToString("o")
}

$metadataJson = $metadata | ConvertTo-Json
$temporaryMetadataPath = Join-Path $sitePublicDir ".installer.$PID.tmp"
try {
    [System.IO.File]::WriteAllText(
        $temporaryMetadataPath,
        "$metadataJson`n",
        [System.Text.UTF8Encoding]::new($false)
    )
    Move-Item -LiteralPath $temporaryMetadataPath -Destination $siteMetadataPath -Force
}
finally {
    if (Test-Path -LiteralPath $temporaryMetadataPath) {
        Remove-Item -LiteralPath $temporaryMetadataPath -Force
    }
}

if (-not $SkipWebsiteBuild) {
    Invoke-NpmScript -WorkingDirectory $websiteDir -Arguments @("run", "build") -Description "Building website with the updated installer"
}

Write-Host "`nInstaller updated successfully:" -ForegroundColor Green
Write-Host "  Source:   $($sourceMsi.FullName)"
Write-Host "  Site MSI: $siteMsiPath"
Write-Host "  Metadata: $siteMetadataPath"
Write-Host "  Version:  $version"
Write-Host "  Size:     $($publishedMsi.Length) bytes"
Write-Host "  SHA-256:  $sha256"

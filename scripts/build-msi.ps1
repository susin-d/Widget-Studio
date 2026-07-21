[CmdletBinding()]
param(
    [switch]$SkipDesktopBuild
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$desktopDir = Join-Path $repoRoot "desktop"
$tauriConfigPath = Join-Path $desktopDir "src-tauri\tauri.conf.json"
$msiOutputDir = Join-Path $desktopDir "src-tauri\target\release\bundle\msi"
$artifactDir = Join-Path $repoRoot "artifacts"
$artifactMsiPath = Join-Path $artifactDir "WidgetStudioInstaller.msi"
$artifactMetadataPath = Join-Path $artifactDir "installer.json"

function Test-MsiFile {
    param([Parameter(Mandatory)][string]$Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $false }

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

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm was not found on PATH. Install Node.js 20+ and try again."
}

$tauriConfig = Get-Content -LiteralPath $tauriConfigPath -Raw | ConvertFrom-Json
$version = [string]$tauriConfig.version
$productName = [string]$tauriConfig.productName
if ([string]::IsNullOrWhiteSpace($version)) { throw "No version was found in $tauriConfigPath." }

if (-not $SkipDesktopBuild) {
    $buildStartedAtUtc = [DateTime]::UtcNow
    Push-Location $desktopDir
    try {
        & npm run tauri:build -- --bundles msi
        if ($LASTEXITCODE -ne 0) { throw "Desktop MSI build failed with exit code $LASTEXITCODE." }
    }
    finally {
        Pop-Location
    }
}

$msiCandidates = Get-ChildItem -LiteralPath $msiOutputDir -Filter "*.msi" -File -ErrorAction SilentlyContinue |
    Where-Object {
        ($SkipDesktopBuild -or $_.LastWriteTimeUtc -ge $buildStartedAtUtc.AddSeconds(-2)) -and (Test-MsiFile $_.FullName)
    } |
    Sort-Object LastWriteTimeUtc -Descending

if ($msiCandidates.Count -eq 0) {
    throw "No valid MSI was found in $msiOutputDir. Build the desktop app first or remove -SkipDesktopBuild."
}

$sourceMsi = $msiCandidates[0]
New-Item -ItemType Directory -Path $artifactDir -Force | Out-Null
Copy-Item -LiteralPath $sourceMsi.FullName -Destination $artifactMsiPath -Force
if (-not (Test-MsiFile $artifactMsiPath)) { throw "The copied MSI failed signature validation." }

$sha256 = (Get-FileHash -LiteralPath $artifactMsiPath -Algorithm SHA256).Hash.ToLowerInvariant()
$metadata = [ordered]@{
    productName = $productName
    version = $version
    fileName = (Split-Path -Leaf $artifactMsiPath)
    sizeBytes = (Get-Item -LiteralPath $artifactMsiPath).Length
    sha256 = $sha256
    generatedAtUtc = [DateTime]::UtcNow.ToString("o")
}
$metadata | ConvertTo-Json | Set-Content -LiteralPath $artifactMetadataPath -Encoding utf8

Write-Host "`nDesktop MSI created successfully:" -ForegroundColor Green
Write-Host "  MSI:      $artifactMsiPath"
Write-Host "  Metadata: $artifactMetadataPath"
Write-Host "  Version:  $version"
Write-Host "  SHA-256:  $sha256"

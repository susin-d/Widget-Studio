[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Version,
    [Parameter(Mandatory)][string]$ArtifactPath,
    [Parameter(Mandatory)][string]$SignaturePath,
    [string]$ReleaseRepository = "susin-d/Widget-Studio",
    [string]$ReleaseTag,
    [string]$OutputPath = (Join-Path $PSScriptRoot "..\desktop\src-tauri\target\release\bundle\updater\latest.json")
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if ([string]::IsNullOrWhiteSpace($ReleaseTag)) {
    $ReleaseTag = "v$Version"
}

$artifact = Get-Item -LiteralPath $ArtifactPath -ErrorAction Stop
$signature = (Get-Content -LiteralPath $SignaturePath -Raw -ErrorAction Stop).Trim()
if ([string]::IsNullOrWhiteSpace($signature)) {
    throw "The updater signature file is empty: $SignaturePath"
}

$encodedAssetName = [Uri]::EscapeDataString($artifact.Name)
$releaseUrl = "https://github.com/$ReleaseRepository/releases/download/$ReleaseTag/$encodedAssetName"
$manifest = [ordered]@{
    version = $Version
    notes = "Widget Studio $Version"
    pub_date = [DateTime]::UtcNow.ToString("o")
    platforms = [ordered]@{
        "windows-x86_64" = [ordered]@{
            url = $releaseUrl
            signature = $signature
        }
    }
}

$outputDirectory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$temporaryPath = Join-Path $outputDirectory ".latest.$PID.tmp"
try {
    $json = $manifest | ConvertTo-Json -Depth 4
    [System.IO.File]::WriteAllText(
        $temporaryPath,
        "$json`n",
        [System.Text.UTF8Encoding]::new($false)
    )
    Move-Item -LiteralPath $temporaryPath -Destination $OutputPath -Force
}
finally {
    if (Test-Path -LiteralPath $temporaryPath) {
        Remove-Item -LiteralPath $temporaryPath -Force
    }
}

Write-Host "Updater manifest written to $OutputPath"
Write-Host "  Version: $Version"
Write-Host "  Asset:   $releaseUrl"

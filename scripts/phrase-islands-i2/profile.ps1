# Aivis 1.2.0 uses Windows known folders, ignoring APPDATA overrides.
$cacheProfile = Join-Path $PSScriptRoot '../../.cache/phrase-islands-i2/profile/AivisSpeech-Engine'
New-Item -ItemType Directory -Force -Path $cacheProfile | Out-Null
$cacheProfile = (Resolve-Path -LiteralPath $cacheProfile).Path
$engineProfile = Join-Path $env:APPDATA 'AivisSpeech-Engine'
if (Test-Path -LiteralPath $engineProfile) {
  $existing = Get-Item -LiteralPath $engineProfile
  if ($existing.LinkType -ne 'Junction' -or $existing.Target -ne $cacheProfile) {
    throw 'Existing Aivis profile preserved. Use a separate Windows account for this isolated pilot.'
  }
} else {
  New-Item -ItemType Junction -Path $engineProfile -Target $cacheProfile | Out-Null
}
Write-Output "Isolated profile: $engineProfile -> $cacheProfile"

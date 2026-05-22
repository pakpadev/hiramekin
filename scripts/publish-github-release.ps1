param(
  [string]$Owner = "pakpadev",
  [string]$Repo = "hiramekin",
  [string]$Tag = "v1.0.0-beta",
  [string]$ApkPath = "artifacts/releases/hiramekin-v1.0.0-beta.apk",
  [string]$ReleaseNotesPath = "docs/release/v1.0.0-beta.md"
)

$ErrorActionPreference = "Stop"

if (-not $env:GITHUB_TOKEN) {
  throw "GITHUB_TOKEN is required. Create a token with repo contents access and set it before running this script."
}

if (-not (Test-Path -LiteralPath $ApkPath)) {
  throw "APK not found: $ApkPath"
}

if (-not (Test-Path -LiteralPath $ReleaseNotesPath)) {
  throw "Release notes not found: $ReleaseNotesPath"
}

$apiHeaders = @{
  Authorization          = "Bearer $env:GITHUB_TOKEN"
  Accept                 = "application/vnd.github+json"
  "X-GitHub-Api-Version" = "2022-11-28"
}

$repoSlug = "$Owner/$Repo"
$releaseApi = "https://api.github.com/repos/$repoSlug/releases"
$releaseByTagApi = "$releaseApi/tags/$Tag"

$releaseNotesFile = Resolve-Path -LiteralPath $ReleaseNotesPath
$releaseNotes = [System.IO.File]::ReadAllText($releaseNotesFile, [System.Text.Encoding]::UTF8)

try {
  $release = Invoke-RestMethod -Method Get -Uri $releaseByTagApi -Headers $apiHeaders
  Write-Host "Found existing release: $($release.html_url)"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -ne 404) {
    throw
  }

  $body = [ordered]@{
    tag_name         = $Tag
    target_commitish = "master"
    name             = "Hiramekin $Tag"
    body             = $releaseNotes
    draft            = $false
    prerelease       = $true
  } | ConvertTo-Json

  $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)

  $release = Invoke-RestMethod -Method Post -Uri $releaseApi -Headers $apiHeaders -Body $bodyBytes -ContentType "application/json; charset=utf-8"
  Write-Host "Created release: $($release.html_url)"
}

$assetName = Split-Path -Leaf $ApkPath
$existingAsset = $release.assets | Where-Object { $_.name -eq $assetName } | Select-Object -First 1

if ($existingAsset) {
  Invoke-RestMethod -Method Delete -Uri $existingAsset.url -Headers $apiHeaders | Out-Null
  Write-Host "Deleted existing asset: $assetName"
}

$encodedAssetName = [System.Uri]::EscapeDataString($assetName)
$uploadUrl = $release.upload_url -replace "\{\?name,label\}", "?name=$encodedAssetName"
$apkBytes = [System.IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $ApkPath))

Invoke-RestMethod `
  -Method Post `
  -Uri $uploadUrl `
  -Headers $apiHeaders `
  -Body $apkBytes `
  -ContentType "application/vnd.android.package-archive" | Out-Null

$hash = Get-FileHash -LiteralPath $ApkPath -Algorithm SHA256
Write-Host "Uploaded: $assetName"
Write-Host "SHA-256: $($hash.Hash)"
Write-Host "Download URL: https://github.com/$repoSlug/releases/download/$Tag/$assetName"

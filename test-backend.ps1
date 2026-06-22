try {
  Write-Host "Testing backend service..."
  $response = Invoke-WebRequest -Uri "https://classlist-server-270569-5-1443465012.sh.run.tcloudbase.com/api/teachers" -UseBasicParsing -TimeoutSec 15
  Write-Host "Response status: $($response.StatusCode)"
  Write-Host "Response content: $($response.Content)"
} catch {
  Write-Host "Error: $_"
}
# Start WorkSphere Laravel API (stops stale processes on the port first)
param(
    [int]$Port = 8765
)

$backendPath = Join-Path $PSScriptRoot "..\backend"
Set-Location $backendPath

Write-Host "Stopping processes listening on port $Port..."
Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
    ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }

Start-Sleep -Seconds 1

Write-Host "Resetting demo passwords..."
php artisan worksphere:reset-demo-passwords | Out-Null

Write-Host ""
Write-Host "Starting Laravel at http://127.0.0.1:$Port"
Write-Host "Test in browser: http://127.0.0.1:$Port/api/health"
Write-Host "Demo login: admin@worksphere.test / Password1!"
Write-Host ""

php artisan serve --host=127.0.0.1 --port=$Port

# MetroSched one-command runner (Windows PowerShell).
#   .\run.ps1          install (first run only), start backend + frontend
#   .\run.ps1 test     run pytest, vitest and the Playwright smoke test
# No seeding step: with no uploads, the backend builds the fleet from the real MetroPT-3 data in data/metropt3/.
param([string]$Task = "start")
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$py = ".\.venv\Scripts\python.exe"

function Install {
    if (-not (Test-Path $py)) { python -m venv .venv }
    & $py -m pip install --only-binary=:all: -q -r requirements.txt
    if (-not (Test-Path "frontend\node_modules")) { npm --prefix frontend ci }
}

switch ($Task) {
    "test" {
        Install
        & $py -m pytest backend\tests -q
        npm --prefix frontend exec vitest run
        npm --prefix frontend exec playwright install chromium
        Push-Location frontend; npx playwright test; Pop-Location
    }
    default {
        Install
        Start-Process -NoNewWindow $py -ArgumentList "-m", "uvicorn", "app.main:app", "--app-dir", "backend", "--port", "8000"
        Write-Host "Backend: http://localhost:8000/docs   Frontend: http://localhost:3000"
        npm --prefix frontend run dev
    }
}

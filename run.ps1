# MetroSched one-command runner (Windows PowerShell).
#   .\run.ps1          install (first run only), seed the database, start backend + frontend
#   .\run.ps1 seed     regenerate data/seed and load it into the database
#   .\run.ps1 test     run pytest, vitest and the Playwright smoke test
param([string]$Task = "start")
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$py = ".\.venv\Scripts\python.exe"

function Install {
    if (-not (Test-Path $py)) { python -m venv .venv }
    & $py -m pip install --only-binary=:all: -q -r requirements.txt
    if (-not (Test-Path "frontend\node_modules")) { npm --prefix frontend ci }
}

function Seed {
    & $py data\generator.py
    & $py -c "import sys; sys.path[:0]=['backend']; from fastapi.testclient import TestClient; from app.main import app; print(TestClient(app).post('/data/seed').json())"
}

switch ($Task) {
    "seed" { Install; Seed }
    "test" {
        Install
        & $py -m pytest backend\tests -q
        npm --prefix frontend exec vitest run
        npm --prefix frontend exec playwright install chromium
        Push-Location frontend; npx playwright test; Pop-Location
    }
    default {
        Install
        Seed
        Start-Process -NoNewWindow $py -ArgumentList "-m", "uvicorn", "app.main:app", "--app-dir", "backend", "--port", "8000"
        Write-Host "Backend: http://localhost:8000/docs   Frontend: http://localhost:3000"
        npm --prefix frontend run dev
    }
}

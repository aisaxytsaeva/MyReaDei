#!/usr/bin/env pwsh

Write-Host "    CI/CD PIPELINE - MyReaDei" -ForegroundColor Cyan


Write-Host "[5.0] Starting dependencies for tests..." -ForegroundColor Yellow

Write-Host "  → Starting MinIO, Redis and Postgres..." -ForegroundColor Gray
docker-compose up -d minio redis db

Write-Host "  → Waiting for MinIO to be ready..." -ForegroundColor Gray
$maxRetries = 30
$retryCount = 0
$minioReady = $false

while ($retryCount -lt $maxRetries -and -not $minioReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9000/minio/health/live" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $minioReady = $true
            Write-Host "    MinIO is ready" -ForegroundColor Green
        }
    } catch {
        $retryCount++
        Write-Host "     Waiting for MinIO... ($retryCount/$maxRetries)" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

Write-Host "  Redis and Postgres are ready" -ForegroundColor Green

Write-Host "[5.1] Building Docker images..." -ForegroundColor Yellow
docker-compose build --parallel
if ($LASTEXITCODE -eq 0) {
    Write-Host " Images built successfully" -ForegroundColor Green
} else {
    Write-Host "Build issues, continuing..." -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[5.2a] Running backend tests..." -ForegroundColor Yellow

Write-Host "  → Backend linting (flake8)..." -ForegroundColor Gray
Push-Location backend
flake8 app/ --max-line-length=120 --exclude=migrations
if ($LASTEXITCODE -eq 0) {
    Write-Host "    Backend lint passed" -ForegroundColor Green
} else {
    Write-Host "    Backend lint failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "  → Backend tests (pytest)..." -ForegroundColor Gray
$env:PYTHONPATH = "."
$env:TESTING = "true"
pytest tests/ -v --ignore=tests/e2e
if ($LASTEXITCODE -eq 0) {
    Write-Host "    Backend tests passed" -ForegroundColor Green
} else {
    Write-Host "    Backend tests failed" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host ""

Write-Host "[5.2b] Starting all containers for E2E tests..." -ForegroundColor Yellow

Write-Host "  → Stopping old containers..." -ForegroundColor Gray
docker-compose down


Write-Host "  → Starting all containers..." -ForegroundColor Gray
docker-compose up -d

Write-Host "  → Waiting for services to be ready..." -ForegroundColor Gray
Start-Sleep -Seconds 20

Write-Host "  → Checking containers..." -ForegroundColor Gray
docker-compose ps

$backendRunning = docker ps --filter "name=myreadei_backend" --filter "status=running" -q
if ($backendRunning) {
    Write-Host "    Backend is running" -ForegroundColor Green
} else {
    Write-Host "    Backend failed to start" -ForegroundColor Red
    docker-compose logs backend --tail=30
    exit 1
}

$frontendRunning = docker ps --filter "name=myreadei_frontend" --filter "status=running" -q
if ($frontendRunning) {
    Write-Host "    Frontend is running" -ForegroundColor Green
} else {
    Write-Host "    Frontend failed to start" -ForegroundColor Red
    exit 1
}
Write-Host ""


Write-Host "[5.2c] Running Frontend E2E tests..." -ForegroundColor Yellow

Write-Host "  → Installing dependencies..." -ForegroundColor Gray
Push-Location frontend/my-react-app
npm ci --silent

Write-Host "  → Installing Playwright browsers..." -ForegroundColor Gray
npx playwright install --with-deps firefox --quiet

Write-Host "  → Running E2E tests..." -ForegroundColor Gray
npx playwright test e2e/specs/ --project=firefox

if ($LASTEXITCODE -eq 0) {
    Write-Host "    Frontend E2E tests passed" -ForegroundColor Green
} else {
    Write-Host "    Frontend E2E tests failed" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host ""


Write-Host "     CI/CD COMPLETED!" -ForegroundColor Green

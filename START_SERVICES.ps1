# Kids Coding Platform - Start Services Script
# Run this script with elevated privileges (as Administrator) to start all services

Write-Host "Kids Coding Platform - Starting Services" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Warning: This script should be run as Administrator for full functionality" -ForegroundColor Yellow
}

# Start database services
Write-Host "Starting database services..." -ForegroundColor Cyan
try {
    docker compose -f docker/docker-compose.db.yml up -d
    Write-Host "Database services started successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to start database services. Make sure Docker is running with proper permissions." -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

# Set environment variable and start API service
Write-Host "Starting API service..." -ForegroundColor Cyan
try {
    $env:DATABASE_URL="postgresql://kids:kids@localhost:5432/kids"
    Set-Location -Path "packages/api"
    Start-Process -NoNewWindow -FilePath "pnpm" -ArgumentList "start:dev"
    Write-Host "API service started successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to start API service." -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

# Start WebSocket service
Write-Host "Starting WebSocket service..." -ForegroundColor Cyan
try {
    Set-Location -Path "../../server/websocket"
    Start-Process -NoNewWindow -FilePath "pnpm" -ArgumentList "dev"
    Write-Host "WebSocket service started successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to start WebSocket service." -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

# Start frontend services
Write-Host "Starting frontend services..." -ForegroundColor Cyan

Write-Host "Starting Parent App..." -ForegroundColor Cyan
try {
    Set-Location -Path "../../apps/parent-app"
    Start-Process -NoNewWindow -FilePath "pnpm" -ArgumentList "dev"
    Write-Host "Parent App started successfully on http://localhost:5173/" -ForegroundColor Green
} catch {
    Write-Host "Failed to start Parent App." -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "Starting Student App..." -ForegroundColor Cyan
try {
    Set-Location -Path "../../apps/student-app"
    Start-Process -NoNewWindow -FilePath "pnpm" -ArgumentList "dev"
    Write-Host "Student App started successfully on http://localhost:5174/" -ForegroundColor Green
} catch {
    Write-Host "Failed to start Student App." -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "Starting Teacher App..." -ForegroundColor Cyan
try {
    Set-Location -Path "../../apps/teacher-app"
    Start-Process -NoNewWindow -FilePath "pnpm" -ArgumentList "dev"
    Write-Host "Teacher App started successfully on http://localhost:5175/" -ForegroundColor Green
} catch {
    Write-Host "Failed to start Teacher App." -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Services started! Please wait a moment for all services to initialize." -ForegroundColor Green
Write-Host ""
Write-Host "Access the applications at:" -ForegroundColor Yellow
Write-Host "  Parent App:   http://localhost:5173/" -ForegroundColor Yellow
Write-Host "  Student App:  http://localhost:5174/" -ForegroundColor Yellow
Write-Host "  Teacher App:  http://localhost:5175/" -ForegroundColor Yellow
Write-Host "  WebSocket:    ws://localhost:4070" -ForegroundColor Yellow
Write-Host "  API Service:  http://localhost:3000/ (when database is available)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Note: API service requires database connectivity to function properly." -ForegroundColor Yellow
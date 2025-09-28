# Kids Coding Platform - Startup Guide

## Current Status

The project has been optimized and is partially running. Here's what's working and what needs attention:

### Running Services
- Parent App: http://localhost:5173/
- Student App: http://localhost:5174/
- Teacher App: http://localhost:5175/
- WebSocket Service: ws://localhost:4070

### Services with Issues
- API Service (http://localhost:3000/): Not running due to database connectivity
- Database Services (PostgreSQL & Redis): Not running due to Docker permissions

## How to Start All Services

### Method 1: Using the PowerShell Script (Recommended)

1. Open PowerShell as Administrator (Right-click PowerShell → "Run as administrator")
2. Navigate to the project directory:
   ```powershell
   cd F:\project\kids-coding-platform
   ```
3. Run the startup script:
   ```powershell
   .\START_SERVICES.ps1
   ```

### Method 2: Manual Startup

1. **Start Database Services** (requires Docker with elevated privileges):
   ```powershell
   docker compose -f docker/docker-compose.db.yml up -d
   ```

2. **Start API Service**:
   ```powershell
   cd packages/api
   $env:DATABASE_URL="postgresql://kids:kids@localhost:5432/kids"
   pnpm start:dev
   ```

3. **Start WebSocket Service**:
   ```powershell
   cd ../../server/websocket
   pnpm dev
   ```

4. **Start Frontend Services** (each in a separate terminal):
   ```powershell
   # Parent App
   cd ../../apps/parent-app
   pnpm dev
   
   # Student App
   cd ../student-app
   pnpm dev
   
   # Teacher App
   cd ../teacher-app
   pnpm dev
   ```

## Troubleshooting

### Docker Permission Issues
If you encounter Docker permission errors:
1. Make sure Docker Desktop is running
2. Run your terminal as Administrator
3. Switch Docker to Windows containers mode if needed

### Database Connection Issues
If the API service fails to connect to the database:
1. Verify PostgreSQL is running on port 5432
2. Check that the database "kids" exists with user "kids" and password "kids"
3. Ensure Redis is running on port 6379

## Accessing the Applications

Once all services are running:
- Parent App: http://localhost:5173/
- Student App: http://localhost:5174/
- Teacher App: http://localhost:5175/
- API Documentation: http://localhost:3000/api (when running)

## Project Status Report
For detailed information about the current status, see [PROJECT_STATUS.md](PROJECT_STATUS.md)
# CampusGPT Docker setup helper for Windows PowerShell.
# Run from the repository root: .\scripts\setup_docker.ps1
$ErrorActionPreference = "Stop"

$composeFile = "docker-compose.fullstack.yml"
$envFile = ".env.fullstack"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker CLI was not found. Install Docker Desktop, start it, then rerun this script."
}
if (-not (Test-Path $composeFile)) {
    throw "Run this script from the CampusGPT repository root. Missing $composeFile."
}
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    throw "Docker Desktop is not running. Start Docker Desktop, wait until its engine is ready, then rerun."
}

if (-not (Test-Path $envFile)) {
    Copy-Item ".env.fullstack.example" $envFile
    Write-Host "Created $envFile from .env.fullstack.example"
}

$envContent = Get-Content $envFile -Raw
if ($envContent -match 'JWT_SECRET=REPLACE_WITH_A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS') {
    $bytes = New-Object byte[] 48
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    $secret = ([BitConverter]::ToString($bytes)).Replace("-", "").ToLowerInvariant()
    $envContent = $envContent.Replace(
        "JWT_SECRET=REPLACE_WITH_A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS",
        "JWT_SECRET=$secret"
    )
    Set-Content -Path $envFile -Value $envContent -NoNewline
    Write-Host "Generated a unique JWT secret in $envFile"
}

$envContent = Get-Content $envFile -Raw
if ($envContent -match 'GEMINI_BASE_URL=http://host.docker.internal:8081/v1' -and $envContent -match 'GEMINI_MODEL=gemini-3.6-flash') {
    Write-Host ""
    Write-Host "IMPORTANT: Gemini Web2API is not included in Docker Compose."
    Write-Host "Start your compatible gateway on this PC at port 8081, or edit GEMINI_BASE_URL and GEMINI_MODEL in $envFile."
    Write-Host "The gateway must provide POST /v1/chat/completions and the configured model."
    Write-Host "Do not put browser cookies or session cookies in GEMINI_API_KEY."
    Write-Host ""
    $answer = Read-Host "Is your Gemini-compatible gateway configured and running? Type YES to continue"
    if ($answer -cne "YES") {
        Write-Host "Setup paused. Configure the gateway and run .\scripts\setup_docker.ps1 again."
        exit 0
    }
}

Write-Host "Validating Docker Compose configuration..."
docker compose --env-file $envFile -f $composeFile config --quiet
if ($LASTEXITCODE -ne 0) { throw "Compose configuration validation failed. Check $envFile." }

Write-Host "Building and starting CampusGPT containers. The first run may take several minutes."
docker compose --env-file $envFile -f $composeFile up --build -d
if ($LASTEXITCODE -ne 0) { throw "Docker Compose failed. Inspect logs with the commands printed below." }

Write-Host ""
Write-Host "CampusGPT containers started."
Write-Host "Frontend:       http://localhost:5173"
Write-Host "Backend health: http://localhost:4000/api/health"
Write-Host "Frontend proxy: http://localhost:5173/api/health"
Write-Host ""
Write-Host "Check readiness: docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml ps"
Write-Host "View logs:       docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml logs -f"
Write-Host "Stop (keep data): docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml down"
Write-Host "Next: create the first administrator using the Docker instructions in README.md."

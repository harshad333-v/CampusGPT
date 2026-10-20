$ErrorActionPreference = "Stop"

$AiRoot = Split-Path -Parent $PSScriptRoot
Push-Location $AiRoot

try {
    Write-Host "CampusGPT local AI setup" -ForegroundColor Cyan
    Write-Host "AI service directory: $AiRoot"

    & py -3.11 --version
    if ($LASTEXITCODE -ne 0) {
        throw "Python 3.11 was not found. Install Python 3.11+ and ensure the Windows py launcher is available."
    }

    $Python = Join-Path $AiRoot ".venv\Scripts\python.exe"
    if (!(Test-Path $Python)) {
        Write-Host "Creating Python virtual environment..."
        & py -3.11 -m venv .venv
        if ($LASTEXITCODE -ne 0) { throw "Failed to create .venv." }
    }

    Write-Host "Upgrading pip..."
    & $Python -m pip install --upgrade pip
    if ($LASTEXITCODE -ne 0) { throw "Failed to upgrade pip." }

    Write-Host "Installing AI service requirements..."
    & $Python -m pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) { throw "Dependency installation failed." }

    $EnvFile = Join-Path $AiRoot ".env"
    if (!(Test-Path $EnvFile)) {
        Copy-Item (Join-Path $AiRoot ".env.example") $EnvFile
        Write-Host "Created .env from .env.example."
    } else {
        Write-Host "Existing .env found; it was not overwritten." -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Green
    Write-Host "1. Check .env uses Ollama embeddings and ChromaDB; keep your Gemini Web API gateway at the configured base URL."
    Write-Host "2. Start Ollama and run: ollama pull nomic-embed-text"
    Write-Host "3. Start your Gemini Web API gateway."
    Write-Host "4. Validate with: .\.venv\Scripts\python.exe scripts\check_local_setup.py"
    Write-Host "5. Index sample documents with: .\.venv\Scripts\python.exe scripts\ingest_directory.py --directory data"
} finally {
    Pop-Location
}

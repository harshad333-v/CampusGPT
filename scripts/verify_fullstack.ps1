# Verify a running CampusGPT stack.

[CmdletBinding()]
param(
    [string]$FrontendUrl = "http://127.0.0.1:3000",
    [string]$BackendUrl = "http://127.0.0.1:4000",
    [string]$AIServiceUrl = "http://127.0.0.1:8000",
    [switch]$SkipAIHealth,
    [switch]$ChatSmokeTest,
    [string]$LoginEmail,
    [string]$Question = "When is the Raksha Bandhan holiday?"
)

$ErrorActionPreference = "Stop"

function Invoke-JsonRequest {
    param(
        [Parameter(Mandatory = $true)][string]$Uri,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$TimeoutSec = 20
    )

    $parameters = @{
        Uri        = $Uri
        Method     = $Method
        TimeoutSec = $TimeoutSec
    }

    if ($Headers.Count -gt 0) {
        $parameters.Headers = $Headers
    }

    if ($null -ne $Body) {
        $parameters.ContentType = "application/json"
        $parameters.Body = $Body | ConvertTo-Json -Depth 8 -Compress
    }

    try {
        return Invoke-RestMethod @parameters
    }
    catch {
        throw "Request failed: $Method $Uri — $($_.Exception.Message)"
    }
}

function Test-HttpPage {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Uri
    )

    try {
        $response = Invoke-WebRequest -Uri $Uri -Method Get -TimeoutSec 15 -UseBasicParsing
        if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
            throw "HTTP $($response.StatusCode)"
        }
        Write-Host "[OK] $Name responded with HTTP $($response.StatusCode): $Uri"
    }
    catch {
        throw "[FAIL] $Name is unreachable at $Uri — $($_.Exception.Message)"
    }
}

Write-Host "CampusGPT end-to-end integration smoke test"
Write-Host "Frontend: $FrontendUrl"
Write-Host "Backend:  $BackendUrl"

Test-HttpPage -Name "Frontend" -Uri ($FrontendUrl.TrimEnd("/") + "/")

$backendHealth = Invoke-JsonRequest -Uri ($BackendUrl.TrimEnd("/") + "/api/health")
if ($backendHealth.status -ne "ok" -or $backendHealth.database -ne "connected") {
    throw "[FAIL] Backend/database health is not ready: status=$($backendHealth.status), database=$($backendHealth.database)"
}
Write-Host "[OK] Backend is healthy and MongoDB is connected."

if (-not $SkipAIHealth) {
    Write-Host "AI service: $AIServiceUrl"
    $aiHealth = Invoke-JsonRequest -Uri ($AIServiceUrl.TrimEnd("/") + "/health")
    if ($aiHealth.status -ne "ok" -or $aiHealth.service -ne "campusgpt-ai") {
        throw "[FAIL] AI service health response was unexpected."
    }
    Write-Host "[OK] FastAPI AI service is healthy."
}

if (-not $ChatSmokeTest) {
    Write-Host ""
    Write-Host "Health checks passed. For a full frontend/backend/AI chat test, rerun with -ChatSmokeTest -LoginEmail <your-admin-or-user-email>."
    exit 0
}

if (-not $LoginEmail) {
    throw "-LoginEmail is required with -ChatSmokeTest."
}

$securePassword = Read-Host "Password for $LoginEmail" -AsSecureString
$passwordPointer = [IntPtr]::Zero
$password = $null
$token = $null

try {
    $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)

    $login = Invoke-JsonRequest -Uri ($BackendUrl.TrimEnd("/") + "/api/v1/auth/login") -Method "POST" -Body @{ email = $LoginEmail; password = $password }
    if (-not $login.success -or -not $login.token) {
        throw "[FAIL] Login was not successful. Verify the account and backend response."
    }
    $token = $login.token
}
finally {
    if ($passwordPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    }
    $password = $null
    $securePassword.Dispose()
}

$headers = @{ Authorization = "Bearer $token" }
$session = Invoke-JsonRequest -Uri ($BackendUrl.TrimEnd("/") + "/api/v1/chat/sessions") -Method "POST" -Headers $headers

if (-not $session.success -or -not $session.data._id) {
    throw "[FAIL] Backend did not create a chat session."
}

$sessionId = [string]$session.data._id
Write-Host "[OK] Authenticated as $($login.user.role); chat session created."

$chat = Invoke-JsonRequest -Uri ($BackendUrl.TrimEnd("/") + "/api/v1/chat/sessions/$sessionId/messages") -Method "POST" -Headers $headers -Body @{ message = $Question } -TimeoutSec 150

if (-not $chat.success -or -not $chat.data.answer) {
    throw "[FAIL] Chat returned no answer. Response: $($chat | ConvertTo-Json -Depth 8 -Compress)"
}

Write-Host ""
Write-Host "[OK] Frontend, backend, and authenticated chat API path are reachable."
Write-Host "Question: $Question"
Write-Host "Grounded: $($chat.data.grounded)"
Write-Host "Query type: $($chat.data.queryType)"
Write-Host "Answer: $($chat.data.answer)"
Write-Host "Source count: $(@($chat.data.sources).Count)"
foreach ($source in @($chat.data.sources)) {
    $page = if ($source.page) { " (page $($source.page))" } else { "" }
    Write-Host "  - $($source.title)$page"
}

if (-not $chat.data.grounded -or @($chat.data.sources).Count -eq 0) {
    throw "[FAIL] Chat completed, but the answer was not grounded with sources. Confirm the user's role can access the document, the sample documents are indexed, and Gemini/Ollama/Chroma are healthy."
}

Write-Host ""
Write-Host "[PASS] End-to-end RAG smoke test passed."
Write-Host "Session ID: $sessionId"
Write-Host "The test chat session was retained so you can inspect it in the UI."

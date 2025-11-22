<#
PowerShell script to run auth + insert + list tests against Supabase REST API.
Usage (non-interactive):
  $env:PROJECT_URL = "https://<PROJECT>.supabase.co"
  $env:ANON_KEY = "<ANON_PUBLIC_KEY>"
  $env:TEST_EMAIL = "cliente@test.local"
  $env:TEST_PASSWORD = "Senha123!"
  pwsh ./supabase/automation/run_tests.ps1

The script requires PowerShell 5+ and network access to your Supabase project.
#>

param()

$projectUrl = $env:PROJECT_URL
$anonKey = $env:ANON_KEY
$email = $env:TEST_EMAIL
$password = $env:TEST_PASSWORD

if (-not $projectUrl -or -not $anonKey -or -not $email -or -not $password) {
  Write-Error "Missing required environment variables. Set PROJECT_URL, ANON_KEY, TEST_EMAIL, TEST_PASSWORD."
  exit 2
}

Write-Host "Obtendo token para $email..."
$body = @{ email = $email; password = $password } | ConvertTo-Json
try {
  $resp = Invoke-RestMethod -Method Post -Uri "$projectUrl/auth/v1/token?grant_type=password" -Headers @{ "apikey" = $anonKey; "Content-Type" = "application/json" } -Body $body -ErrorAction Stop
} catch {
  Write-Error "Falha ao obter token: $_"
  exit 3
}

$token = $resp.access_token
if (-not $token) { Write-Error "Nenhum access_token retornado."; exit 4 }
Write-Host "Token obtido. (length=$($token.Length))"

# Prepare payload
$payload = @{ 
  cliente_id = $email
  valor = 19.90
  data_vencimento = (Get-Date).AddDays(7).ToString('yyyy-MM-dd')
  status = 'pendente'
  descricao = 'Teste RLS automático via PowerShell'
} | ConvertTo-Json

Write-Host "Enviando POST /rest/v1/cobrancas ..."
try {
  $insertResp = Invoke-RestMethod -Method Post -Uri "$projectUrl/rest/v1/cobrancas" -Headers @{ "apikey" = $anonKey; "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } -Body $payload -ErrorAction Stop
  Write-Host "INSERT response:"; $insertResp | ConvertTo-Json -Depth 5
} catch {
  Write-Error "Erro ao inserir cobranca: $_"
}

Write-Host "Consultando /rest/v1/cobrancas (autenticado) ..."
try {
  $list = Invoke-RestMethod -Method Get -Uri "$projectUrl/rest/v1/cobrancas" -Headers @{ "apikey" = $anonKey; "Authorization" = "Bearer $token" } -ErrorAction Stop
  Write-Host "Lista de cobranças retornada:"; $list | ConvertTo-Json -Depth 5
} catch {
  Write-Error "Erro ao listar cobrancas: $_"
}

Write-Host "Teste automático concluído. Verifique no painel Supabase ou via SELECT as linhas e o campo cliente_profile_id."
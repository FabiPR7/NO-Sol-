$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Test-FirebaseAuth {
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  & npx firebase projects:list *> $null
  $ok = $LASTEXITCODE -eq 0
  $ErrorActionPreference = $previous
  return $ok
}

if (-not (Test-Path ".env.production")) {
  Copy-Item ".env" ".env.production"
}

Write-Host "Compilando app..." -ForegroundColor Cyan
npm run build:prod
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Instalando dependencias de Functions..." -ForegroundColor Cyan
Set-Location "functions"
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Set-Location $Root

if (-not (Test-FirebaseAuth)) {
  Write-Host "Firebase CLI sin sesion. Abre el navegador para iniciar sesion..." -ForegroundColor Yellow
  Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$Root'; npx firebase login --reauth"
  )
  Write-Host "Esperando autenticacion (max. 3 min)..." -ForegroundColor Yellow

  $deadline = (Get-Date).AddMinutes(3)
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 5
    if (Test-FirebaseAuth) {
      Write-Host "Sesion Firebase OK." -ForegroundColor Green
      break
    }
  }

  if (-not (Test-FirebaseAuth)) {
    Write-Host "No se pudo autenticar. Ejecuta: npx firebase login --reauth" -ForegroundColor Red
    exit 1
  }
}

function Deploy-Hosting {
  Write-Host "Desplegando hosting en nomassolo.web.app..." -ForegroundColor Cyan
  & npx firebase deploy --only hosting
  return $LASTEXITCODE
}

function Deploy-Functions {
  Write-Host "Desplegando functions (requiere plan Blaze)..." -ForegroundColor Cyan
  & npx firebase deploy --only functions
  return $LASTEXITCODE
}

$dailyLine = Get-Content ".env" | Where-Object { $_ -match '^DAILY_API_KEY=' } | Select-Object -First 1
if ($dailyLine) {
  $dailyKey = $dailyLine.Substring("DAILY_API_KEY=".Length).Trim()
  if ($dailyKey) {
    Write-Host "Configurando secreto DAILY_API_KEY..." -ForegroundColor Cyan
    $ErrorActionPreference = "SilentlyContinue"
    $dailyKey | npx firebase functions:secrets:set DAILY_API_KEY --force *> $null
    $ErrorActionPreference = "Stop"
    if ($LASTEXITCODE -ne 0) {
      Write-Host "Aviso: DAILY_API_KEY no guardado (plan Blaze requerido). Las llamadas no funcionaran hasta activarlo." -ForegroundColor Yellow
    }
  }
}

$hostingExit = Deploy-Hosting
if ($hostingExit -ne 0) { exit $hostingExit }

$functionsExit = Deploy-Functions
if ($functionsExit -ne 0) {
  Write-Host "Hosting publicado. Functions pendientes: activa plan Blaze en Firebase y vuelve a ejecutar npm run deploy:functions" -ForegroundColor Yellow
  exit 0
}

Write-Host "Deploy completo: https://nomassolo.web.app" -ForegroundColor Green
exit 0

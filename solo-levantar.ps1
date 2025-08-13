Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   LEVANTANDO SERVIDOR CCPRIMAVERA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js no está instalado" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Verificar si el proyecto está construido
if (-not (Test-Path ".next")) {
    Write-Host "ERROR: El proyecto no está construido" -ForegroundColor Red
    Write-Host ""
    Write-Host "Ejecuta primero: deploy-produccion.ps1" -ForegroundColor Yellow
    Write-Host "O ejecuta: build-project.bat" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Verificar si las dependencias están instaladas
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "✓ Proyecto ya construido" -ForegroundColor Green
Write-Host "✓ Dependencias instaladas" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    INICIANDO SERVIDOR EN PRODUCCION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "El servidor estara disponible en: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Para detener: Ctrl+C o ejecuta stop-server.bat" -ForegroundColor Yellow
Write-Host ""

# Iniciar el servidor
npm start


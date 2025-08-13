Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   LEVANTANDO SERVIDOR CCPRIMAVERA" -ForegroundColor Cyan
Write-Host "   (DESDE CUALQUIER LUGAR)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# RUTA ABSOLUTA DEL PROYECTO - CAMBIA ESTA RUTA SI ES NECESARIO
$projectPath = "D:\SistemaCCP_web\cpprimavera"

Write-Host "Buscando proyecto en: $projectPath" -ForegroundColor Yellow

# Verificar si la ruta existe
if (-not (Test-Path $projectPath)) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "    RUTA NO ENCONTRADA" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "La ruta no existe: $projectPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para cambiar la ruta:" -ForegroundColor Yellow
    Write-Host "1. Abre este archivo con Notepad" -ForegroundColor Yellow
    Write-Host "2. Cambia la línea: `$projectPath = 'TU_RUTA_AQUI'" -ForegroundColor Yellow
    Write-Host "3. Guarda y ejecuta nuevamente" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Verificar si es el proyecto correcto
if (-not (Test-Path "$projectPath\package.json")) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "    NO ES UN PROYECTO NODE.JS" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "La carpeta no contiene un proyecto Node.js válido" -ForegroundColor Red
    Write-Host "Ruta: $projectPath" -ForegroundColor Red
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

if (-not (Test-Path "$projectPath\.next")) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "    PROYECTO NO CONSTRUIDO" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "El proyecto no está construido (.next no existe)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Ejecuta primero: deploy-produccion.ps1" -ForegroundColor Yellow
    Write-Host "O ejecuta: npm run build" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "✓ Proyecto encontrado y validado" -ForegroundColor Green

# Cambiar al directorio del proyecto
Write-Host ""
Write-Host "Cambiando al directorio del proyecto..." -ForegroundColor Yellow
Set-Location $projectPath
Write-Host "✓ Directorio actual: $(Get-Location)" -ForegroundColor Green

# Verificar si Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js no está instalado" -ForegroundColor Red
    Write-Host "Por favor instala Node.js desde https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Verificar si las dependencias están instaladas
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "✓ Proyecto configurado correctamente" -ForegroundColor Green
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

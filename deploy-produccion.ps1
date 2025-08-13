Write-Host "========================================" -ForegroundColor Green
Write-Host "   DESPLIEGUE COMPLETO EN PRODUCCION" -ForegroundColor Green
Write-Host "   CCPRIMAVERA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

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

Write-Host ""

# Verificar si las dependencias están instaladas
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias del proyecto..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Fallo al instalar dependencias" -ForegroundColor Red
        Read-Host "Presiona Enter para salir"
        exit 1
    }
    Write-Host "✓ Dependencias instaladas" -ForegroundColor Green
} else {
    Write-Host "✓ Dependencias ya instaladas" -ForegroundColor Green
}

Write-Host ""

# Construir el proyecto
Write-Host "Construyendo proyecto para produccion..." -ForegroundColor Yellow
Write-Host "Esto puede tomar varios minutos..." -ForegroundColor Yellow
Write-Host ""

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "    ERROR EN LA CONSTRUCCION" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Hubo un error durante la construccion" -ForegroundColor Red
    Write-Host "Revisa los mensajes de error arriba" -ForegroundColor Red
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    CONSTRUCCION EXITOSA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Verificar que la carpeta .next existe
if (-not (Test-Path ".next")) {
    Write-Host "ERROR: La carpeta .next no se creo correctamente" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "✓ Proyecto construido exitosamente" -ForegroundColor Green
Write-Host "✓ Carpeta .next creada" -ForegroundColor Green
Write-Host ""

# Iniciar el servidor en produccion
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    INICIANDO SERVIDOR EN PRODUCCION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "El servidor estara disponible en: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Para detener el servidor:" -ForegroundColor Yellow
Write-Host "- Presiona Ctrl+C en esta ventana, o" -ForegroundColor Yellow
Write-Host "- Ejecuta stop-server.bat en otra ventana" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    SERVIDOR EN LINEA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Iniciar el servidor
npm start


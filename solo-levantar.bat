@echo off
echo ========================================
echo    LEVANTANDO SERVIDOR CCPRIMAVERA
echo    (SIN CONSTRUIR)
echo ========================================
echo.

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no está instalado
    pause
    exit /b 1
)

REM Verificar si el proyecto está construido
if not exist ".next" (
    echo ERROR: El proyecto no está construido
    echo.
    echo Ejecuta primero: deploy-produccion.bat
    echo O ejecuta: build-project.bat
    echo.
    pause
    exit /b 1
)

REM Verificar si las dependencias están instaladas
if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
)

echo.
echo ✓ Proyecto ya construido
echo ✓ Dependencias instaladas
echo.
echo ========================================
echo    INICIANDO SERVIDOR EN PRODUCCION
echo ========================================
echo.
echo El servidor estara disponible en: http://localhost:3000
echo.
echo Para detener: Ctrl+C o ejecuta stop-server.bat
echo.

REM Iniciar el servidor
npm start

pause


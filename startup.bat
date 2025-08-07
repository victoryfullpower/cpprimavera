@echo off
echo ========================================
echo    CCPrimavera - Sistema de Gestión
echo ========================================
echo.

echo Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js no está instalado o no está en el PATH
    pause
    exit /b 1
)

echo.
echo Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
)

echo.
echo Verificando archivo de variables de entorno...
if not exist ".env.local" (
    echo ADVERTENCIA: El archivo .env.local no existe
    echo Por favor, crea el archivo .env.local con las variables necesarias
    echo Consulta ENVIRONMENT_SETUP.md para más información
    echo.
    pause
)

echo.
echo Generando cliente de Prisma...
npx prisma generate

echo.
echo Iniciando aplicación en modo desarrollo...
echo.
npm run dev

pause


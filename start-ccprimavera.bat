@echo off
REM Script de inicio automático para CCPrimavera
REM Este script se ejecutará al iniciar Windows

echo ========================================
echo   Iniciando CCPrimavera - Sistema CCP
echo ========================================

REM Cambiar al directorio del proyecto
cd /d "D:\SistemaCCP_web\cpprimavera"

REM Esperar a que el sistema esté completamente cargado
timeout /t 30 /nobreak > nul

REM Verificar si Node.js está disponible
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no está disponible
    echo Esperando 60 segundos más...
    timeout /t 60 /nobreak > nul
)

REM Verificar si PM2 está disponible
pm2 --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PM2 no está disponible
    echo Instalando PM2...
    npm install -g pm2
)

REM Detener procesos anteriores si existen
pm2 kill > nul 2>&1

REM Iniciar la aplicación
echo Iniciando CCPrimavera...
pm2 start ecosystem.config.js

REM Guardar configuración
pm2 save

echo CCPrimavera iniciado exitosamente
echo Aplicación disponible en: http://localhost:3000

REM Mantener la ventana abierta por 10 segundos para ver el resultado
timeout /t 10 /nobreak > nul

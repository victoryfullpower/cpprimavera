@echo off
REM Script para configurar el inicio automático de CCPrimavera en Windows
REM Ejecutar como Administrador

echo ========================================
echo   Configuración de Inicio Automático
echo   CCPrimavera - Sistema CCP
echo ========================================
echo.

REM Verificar si se ejecuta como administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Este script debe ejecutarse como Administrador
    echo Haz clic derecho en el archivo y selecciona "Ejecutar como administrador"
    pause
    exit /b 1
)

echo Configurando inicio automático...
echo.

REM Crear tarea programada para inicio automático
schtasks /create /tn "CCPrimavera AutoStart" /tr "D:\SistemaCCP_web\cpprimavera\start-ccprimavera.bat" /sc onstart /ru "SYSTEM" /f

if %errorlevel% equ 0 (
    echo ✓ Tarea programada creada exitosamente
    echo.
    echo CCPrimavera se iniciará automáticamente cuando reinicies la PC
    echo.
    echo Para verificar la tarea creada, ejecuta:
    echo schtasks /query /tn "CCPrimavera AutoStart"
    echo.
    echo Para eliminar la tarea más tarde, ejecuta:
    echo schtasks /delete /tn "CCPrimavera AutoStart" /f
) else (
    echo ✗ Error al crear la tarea programada
)

echo.
echo ========================================
pause

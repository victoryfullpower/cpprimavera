@echo off
echo ========================================
echo    DETENIENDO SERVIDOR CCPRIMAVERA
echo ========================================
echo.

REM Buscar y terminar procesos de Node.js que estén ejecutando en el puerto 3000
echo Buscando procesos del servidor en el puerto 3000...

REM Encontrar el PID del proceso que usa el puerto 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    set pid=%%a
    goto :found
)

:found
if defined pid (
    echo Proceso encontrado con PID: %pid%
    echo Terminando proceso...
    taskkill /PID %pid% /F >nul 2>&1
    if %errorlevel% equ 0 (
        echo Servidor detenido exitosamente
    ) else (
        echo No se pudo detener el proceso. Intentando método alternativo...
        REM Método alternativo: terminar todos los procesos de Node.js
        taskkill /IM node.exe /F >nul 2>&1
        echo Todos los procesos de Node.js han sido terminados
    )
) else (
    echo No se encontraron procesos ejecutándose en el puerto 3000
    echo El servidor ya está detenido
)

echo.
echo Servidor detenido.
pause


@echo off
title FinFlow — Sistema Financeiro
color 0A

echo.
echo  =========================================
echo   FinFlow — Sistema de Gestao Financeira
echo  =========================================
echo.

:: Verificar se o servidor ja esta rodando
netstat -ano | findstr ":3000" >nul 2>&1
if %errorlevel% == 0 (
    echo  [OK] Servidor ja esta rodando na porta 3000.
    echo.
    echo  Abrindo o sistema no navegador...
    timeout /t 1 >nul
    start "" "http://localhost:3000"
    goto :END
)

echo  Iniciando o servidor backend...
echo.

:: Mudar para a pasta do projeto
cd /d "%~dp0"

:: Iniciar o servidor em background
start /min cmd /c "node server.js"

:: Aguardar o servidor subir
echo  Aguardando servidor inicializar...
timeout /t 3 >nul

:: Abrir o navegador
echo  Abrindo o sistema no navegador...
start "" "http://localhost:3000"

:END
echo.
echo  Sistema aberto! Acesse: http://localhost:3000
echo.
echo  Pressione qualquer tecla para fechar esta janela.
pause >nul

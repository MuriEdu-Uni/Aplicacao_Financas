@echo off
chcp 65001 > nul
title FinGestão - Abrir no Navegador

echo =====================================================================
echo    FinGestão - Aplicativo de Gestão Financeira Pessoal
echo    Autores: Dennis Gabriel de Oliveira e Murilo da Silva Santos
echo    UniCesumar - Curitiba / PR
echo =====================================================================
echo.
echo [INFO] Abrindo o aplicativo de Gestão Financeira no seu navegador padrão...
echo [INFO] Todos os recursos funcionam 100%% offline e com privacidade total!
echo.

start "" "%~dp0index.html"

exit /b 0

@echo off
chcp 65001 > nul
title FinGestão - Aplicativo de Gestão Financeira Pessoal (UniCesumar)

echo =====================================================================
echo    FinGestão - Aplicativo de Gestão Financeira Pessoal
echo    Autores: Dennis Gabriel de Oliveira e Murilo da Silva Santos
echo    UniCesumar - Análise e Desenvolvimento de Sistemas
echo =====================================================================
echo.

set JAVA_BIN=java
set JAVAC_BIN=javac

REM 1. Verifica se java existe no PATH
where java >nul 2>nul
if %errorlevel% equ 0 goto java_found

REM 2. Verifica Java no JetBrains JBR instalado
if exist "C:\Program Files\JetBrains\IntelliJ IDEA 2026.2.3\jbr\bin\java.exe" (
    set "JAVA_BIN=C:\Program Files\JetBrains\IntelliJ IDEA 2026.2.3\jbr\bin\java.exe"
    set "JAVAC_BIN=C:\Program Files\JetBrains\IntelliJ IDEA 2026.2.3\jbr\bin\javac.exe"
    goto java_found
)

REM 3. Verifica em JAVA_HOME
if defined JAVA_HOME (
    if exist "%JAVA_HOME%\bin\java.exe" (
        set "JAVA_BIN=%JAVA_HOME%\bin\java.exe"
        set "JAVAC_BIN=%JAVA_HOME%\bin\javac.exe"
        goto java_found
    )
)

REM Se não encontrou Java, abre o site diretamente pelo index.html (Modo 100% autônomo)
echo [AVISO] Java não foi detectado no PATH do sistema.
echo [INFO] Abrindo o aplicativo em Modo Local Direto no seu navegador...
echo.
start "" "%~dp0index.html"
exit /b 0

:java_found
echo [OK] Java detectado: "%JAVA_BIN%"
echo.

REM Compila se necessário
if not exist "%~dp0bin\com\gestaofinanceira\Server.class" (
    echo [INFO] Compilando servidor Java...
    if not exist "%~dp0bin" mkdir "%~dp0bin"
    "%JAVAC_BIN%" -d "%~dp0bin" "%~dp0src\main\java\com\gestaofinanceira\Server.java"
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao compilar o servidor Java.
        echo [INFO] Abrindo diretamente no navegador...
        start "" "%~dp0index.html"
        exit /b 1
    )
)

echo [INFO] Iniciando servidor local na porta 8080...
echo [INFO] O site sera aberto automaticamente no seu navegador.
echo [DICA] Para encerrar o servidor, feche esta janela ou pressione Ctrl+C.
echo.

start "" http://localhost:8080

cd /d "%~dp0"
"%JAVA_BIN%" -cp bin com.gestaofinanceira.Server 8080

pause

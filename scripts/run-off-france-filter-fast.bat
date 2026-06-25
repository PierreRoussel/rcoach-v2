@echo off
setlocal EnableExtensions

set "REPO=%~dp0.."
set "INPUT=E:\off\openfoodfacts-products.jsonl"
set "OUTPUT=E:\off\off-france-lite.jsonl"
set "LOG=E:\off\filter-off-france-fast.log"
set "WORKERS=%NUMBER_OF_PROCESSORS%"

cd /d "%REPO%"

if not exist "%INPUT%" (
  echo Fichier source introuvable: %INPUT%
  pause
  exit /b 1
)

echo Fast OFF filter...
echo Workers: %WORKERS%
echo Input:   %INPUT%
echo Output:  %OUTPUT%
echo.

node "%REPO%\scripts\filter-off-france-jsonl-fast.mjs" --input "%INPUT%" --output "%OUTPUT%" --workers %WORKERS% > "%LOG%" 2>&1

echo Done. Exit code: %ERRORLEVEL%
echo See %LOG%
pause

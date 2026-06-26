@echo off
setlocal EnableExtensions

set "REPO=%~dp0.."
set "INPUT=E:\off\en.openfoodfacts.org.products.csv.gz"
set "OUTPUT=E:\off\off-france-lite-csv.jsonl"
set "LOG=E:\off\filter-off-france-csv.log"
set "WORKERS=%NUMBER_OF_PROCESSORS%"

cd /d "%REPO%"

if not exist "%INPUT%" (
  echo Fichier source introuvable: %INPUT%
  echo Telechargez: https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz
  pause
  exit /b 1
)

echo OFF CSV filter...
echo Workers: %WORKERS%
echo Input:   %INPUT%
echo Output:  %OUTPUT%
echo.

node "%REPO%\scripts\filter-off-france-csv.mjs" --input "%INPUT%" --output "%OUTPUT%" --workers %WORKERS% > "%LOG%" 2>&1

echo Done. Exit code: %ERRORLEVEL%
echo See %LOG%
pause

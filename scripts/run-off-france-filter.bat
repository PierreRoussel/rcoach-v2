@echo off
setlocal EnableExtensions

set "REPO=%~dp0.."
set "INPUT=E:\off\openfoodfacts-products.jsonl"
set "OUTPUT=E:\off\off-france-lite.jsonl"
set "LOG=E:\off\filter-off-france.log"

cd /d "%REPO%"

if not exist "%INPUT%" (
  echo Fichier source introuvable: %INPUT%
  echo Verifiez que le dump OFF est bien dans E:\off\
  pause
  exit /b 1
)

if not exist "E:\off\" (
  echo Dossier E:\off introuvable.
  pause
  exit /b 1
)

echo Filtering OFF dump...
echo Repo:   %CD%
echo Input:  %INPUT%
echo Output: %OUTPUT%
echo Log:    %LOG%
echo.

node "%REPO%\scripts\filter-off-france-jsonl.mjs" --input "%INPUT%" --output "%OUTPUT%" > "%LOG%" 2>&1

echo.
echo Done. Exit code: %ERRORLEVEL%
echo See %LOG% for stats.
pause

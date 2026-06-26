@echo off
setlocal EnableExtensions

set "REPO=%~dp0.."
set "INPUT=E:\off\off-france-lite-csv.jsonl"
set "LOG=E:\off\import-off-france.log"

cd /d "%REPO%"

if not exist "%INPUT%" (
  echo Fichier source introuvable: %INPUT%
  echo Generez-le avec run-off-france-filter-csv.bat
  pause
  exit /b 1
)

if "%DATABASE_URL%"=="" (
  echo DATABASE_URL manquant.
  echo Nhost Dashboard -^> Settings -^> Database -^> Connection string
  echo Puis: set DATABASE_URL=postgres://...
  pause
  exit /b 1
)

echo OFF JSONL import...
echo Input: %INPUT%
echo.

node "%REPO%\scripts\import-off-france-jsonl.mjs" --input "%INPUT%" > "%LOG%" 2>&1

echo Done. Exit code: %ERRORLEVEL%
echo See %LOG%
pause

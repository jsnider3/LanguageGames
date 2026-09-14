@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel% equ 0 (
  py -3 run_game.py
) else (
  python run_game.py
)
if errorlevel 1 pause

@echo off
echo ========================================
echo    AN Traders - Starting Live Server
echo ========================================
echo.

cd /d "%~dp0"

echo Installing/Verifying dependencies...
pip install -r requirements.txt -q

echo.
echo Starting server on http://localhost:8000
echo Press CTRL+C to stop the server.
echo.
python -m uvicorn main:app --host 0.0.0.0 --port 8000
pause

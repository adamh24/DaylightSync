@echo off
echo Starting DaylightSync Simulation...
echo Dashboard will open at http://localhost:8000
echo.
echo Press Ctrl+C to stop.
echo.

".venv\Scripts\python.exe" -m uvicorn sim_backend:app --reload --port 8000

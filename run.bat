@echo off
echo Starting IT Dependency Mapper...
if exist "venv\bin\python.exe" (
    venv\bin\python.exe app.py
) else if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe app.py
) else (
    python app.py
)
pause

IT DEPENDENCY MAPPER — COMPLETE LOCAL ACADEMIC PROJECT

WHAT IS INCLUDED
- Responsive dashboard with total, online, offline, and history counts
- Dependency map nodes with service type, configured dependency, and current status
- Live TCP host/port checks for all services or one service through the API
- Add, edit, delete, and search service records
- Recent offline alerts and troubleshooting suggestions
- Persistent SQLite database for services and monitoring history
- Monitoring history page (latest 250 records) and clear-history action
- JSON endpoints: /health, /api/services, /api/status, /api/status/<id>

REQUIREMENTS
- Python 3.10 or newer
- Flask (installed from requirements.txt)

RUN ON WINDOWS / VS CODE
1. Extract the ZIP file.
2. Open the extracted IT_Dependency_Mapper folder in VS Code.
3. Select Terminal > New Terminal.
4. Run:
   python -m pip install -r requirements.txt
5. Run:
   python app.py
6. Open http://127.0.0.1:5000 in your browser.
7. Stop the server with Ctrl+C in the terminal.

HOW TO USE
- Click “Check All Services” to test each configured host and port.
- Use the service search box to filter the table.
- Use Edit to update a service; Add a service to create one; Delete to remove one.
- Click a dependency node to inspect its host, port, dependency, and latest status.
- Open History to review recorded checks or clear the history.
- The API health test is available at http://127.0.0.1:5000/health

IMPORTANT LIMITATIONS
This academic demo tests TCP reachability, not full application health. A port may be reachable while the application is broken. Example hosts and ports are samples; edit them to match services that exist in your environment. The default local API and database ports may show Offline unless those services are running. Network restrictions, DNS, and firewalls can affect results. The app does not restart or repair services automatically. Use only hosts you are authorized to monitor.

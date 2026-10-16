# IT_dependency

## IT Dependency Mapper
A full-stack infrastructure monitoring dashboard that maps IT services, tests TCP port reachability on demand, tracks dependency relationships, and stores monitoring history.

### Features
- **Interactive Dependency Map**: Visualize services and their dependencies.
- **On-Demand TCP Health Checks**: Tests host/port reachability with response time tracking.
- **Real-Time Dashboard**: Summary metrics for total, online, and offline services.
- **Service Management**: Add, edit, delete, and search configured services.
- **Historical Monitoring Log**: View and clear past check results.
- **RESTful API**: JSON endpoints for status checks (`/api/status`, `/api/services`, `/health`).

### Tech Stack
- **Backend**: Python 3, Flask, SQLite / MySQL
- **Frontend**: HTML5, Vanilla CSS (Modern design system), Vanilla JavaScript

### Quick Start
1. Clone the repository:
   ```bash
   git clone https://github.com/artidavghat/IT_dependency.git
   cd IT_dependency
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy environment configuration:
   ```bash
   copy .env.example .env
   ```
4. Run the application:
   ```bash
   python app.py
   ```
   Or on Windows, double-click `run.bat`.
5. Open your browser at `http://127.0.0.1:5000`.

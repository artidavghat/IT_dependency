import os
from pathlib import Path
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
import sqlite3, socket, time
from datetime import datetime

# Load .env file if available
env_file = Path(__file__).with_name(".env")
if env_file.exists():
    with open(env_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())

base_dir = Path(__file__).resolve().parent
templates_dir = base_dir / "templates" if (base_dir / "templates").exists() else base_dir
static_dir = base_dir / "static" if (base_dir / "static").exists() else base_dir

app = Flask(
    __name__,
    template_folder=str(templates_dir),
    static_folder=str(static_dir),
    static_url_path="/static"
)
app.secret_key = os.environ.get("SECRET_KEY", "it-dependency-mapper-local-demo")
db_name = os.environ.get("DATABASE_PATH", "it_mapper.db")
DB = Path(__file__).with_name(db_name)
CHECK_TIMEOUT = float(os.environ.get("CHECK_TIMEOUT", "1.5"))

DEFAULTS = [
    ("Web Application", "Application", "example.com", 443, "API Server"),
    ("API Server", "Server", "127.0.0.1", 5000, "Database"),
    ("Database", "Database", "127.0.0.1", 3306, ""),
    ("DNS Service", "Network", "8.8.8.8", 53, ""),
]

def db():
    con = sqlite3.connect(DB, timeout=10)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    return con

def init_db():
    with db() as con:
        con.execute("""CREATE TABLE IF NOT EXISTS services(
            id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
            service_type TEXT NOT NULL, host TEXT NOT NULL, port INTEGER NOT NULL,
            depends_on TEXT NOT NULL DEFAULT '')""")
        con.execute("""CREATE TABLE IF NOT EXISTS checks(
            id INTEGER PRIMARY KEY AUTOINCREMENT, service_id INTEGER NOT NULL,
            status TEXT NOT NULL, response_ms REAL, checked_at TEXT NOT NULL,
            details TEXT, FOREIGN KEY(service_id) REFERENCES services(id) ON DELETE CASCADE)""")
        if con.execute("SELECT COUNT(*) FROM services").fetchone()[0] == 0:
            con.executemany("INSERT INTO services(name,service_type,host,port,depends_on) VALUES(?,?,?,?,?)", DEFAULTS)

def get_services(with_latest=True):
    with db() as con:
        rows = [dict(r) for r in con.execute("SELECT * FROM services ORDER BY id")]
        if with_latest:
            for s in rows:
                latest = con.execute("SELECT status,response_ms,checked_at,details FROM checks WHERE service_id=? ORDER BY id DESC LIMIT 1", (s["id"],)).fetchone()
                s.update(dict(latest) if latest else {"status":"Not checked", "response_ms":None, "checked_at":"—", "details":"Run a check to test this endpoint."})
    return rows

def check_port(host, port, timeout=CHECK_TIMEOUT):
    start = time.perf_counter()
    try:
        with socket.create_connection((host, int(port)), timeout=timeout):
            ms = round((time.perf_counter() - start) * 1000, 1)
            return "Online", ms, f"TCP connection to {host}:{port} succeeded."
    except (OSError, ValueError) as exc:
        ms = round((time.perf_counter() - start) * 1000, 1)
        reason = str(exc) or exc.__class__.__name__
        return "Offline", ms, f"Could not connect to {host}:{port}: {reason}"

def check_and_save(service):
    status, ms, details = check_port(service["host"], service["port"])
    when = datetime.now().astimezone().strftime("%Y-%m-%d %H:%M:%S %Z")
    with db() as con:
        con.execute("INSERT INTO checks(service_id,status,response_ms,checked_at,details) VALUES(?,?,?,?,?)",
                    (service["id"], status, ms, when, details))
    return {**service, "status":status, "response_ms":ms, "checked_at":when, "details":details}

def valid_form(form):
    name = form.get("name", "").strip()
    typ = form.get("service_type", "Other").strip() or "Other"
    host = form.get("host", "").strip()
    depends = form.get("depends_on", "").strip()
    try:
        port = int(form.get("port", ""))
    except (ValueError, TypeError):
        return None, "Port must be a number between 1 and 65535."
    if not name or not host:
        return None, "Service name and host are required."
    if not 1 <= port <= 65535:
        return None, "Port must be between 1 and 65535."
    return {"name":name, "service_type":typ, "host":host, "port":port, "depends_on":depends}, None

@app.route("/")
def home():
    items = get_services()
    online = sum(s["status"] == "Online" for s in items)
    offline = sum(s["status"] == "Offline" for s in items)
    with db() as con:
        alerts = [dict(r) for r in con.execute("SELECT c.checked_at,s.name,c.details FROM checks c JOIN services s ON s.id=c.service_id WHERE c.status='Offline' ORDER BY c.id DESC LIMIT 6")]
        history_count = con.execute("SELECT COUNT(*) FROM checks").fetchone()[0]
    return render_template("index.html", services=items, total=len(items), online=online, offline=offline, alerts=alerts, history_count=history_count)

@app.route("/api/status", methods=["GET", "POST"])
def api_status():
    results = [check_and_save(s) for s in get_services(with_latest=False)]
    with db() as con:
        history_count = con.execute("SELECT COUNT(*) FROM checks").fetchone()[0]
    return jsonify(services=results, total=len(results), online=sum(s["status"] == "Online" for s in results), offline=sum(s["status"] == "Offline" for s in results), history_count=history_count, checked_at=datetime.now().astimezone().strftime("%Y-%m-%d %H:%M:%S %Z"))

@app.route("/api/status/<int:sid>", methods=["POST"])
def api_one_status(sid):
    with db() as con:
        row = con.execute("SELECT * FROM services WHERE id=?", (sid,)).fetchone()
    if not row:
        return jsonify(error="Service not found"), 404
    return jsonify(check_and_save(dict(row)))

@app.route("/services/add", methods=["POST"])
def add_service():
    data, error = valid_form(request.form)
    if error:
        flash(error, "error")
        return redirect(url_for("home") + "#services")
    with db() as con:
        exists = con.execute("SELECT 1 FROM services WHERE lower(name)=lower(?)", (data["name"],)).fetchone()
        if exists:
            flash("A service with this name already exists. Choose a unique name.", "error")
            return redirect(url_for("home") + "#services")
        con.execute("INSERT INTO services(name,service_type,host,port,depends_on) VALUES(:name,:service_type,:host,:port,:depends_on)", data)
    flash("Service added successfully.", "success")
    return redirect(url_for("home") + "#services")

@app.route("/services/edit/<int:sid>", methods=["GET", "POST"])
def edit_service(sid):
    with db() as con:
        current = con.execute("SELECT * FROM services WHERE id=?", (sid,)).fetchone()
    if not current:
        flash("Service not found.", "error")
        return redirect(url_for("home") + "#services")
    if request.method == "POST":
        data, error = valid_form(request.form)
        if error:
            flash(error, "error")
            return redirect(url_for("edit_service", sid=sid))
        with db() as con:
            exists = con.execute("SELECT 1 FROM services WHERE lower(name)=lower(?) AND id<>?", (data["name"], sid)).fetchone()
            if exists:
                flash("Another service already uses this name.", "error")
                return redirect(url_for("edit_service", sid=sid))
            con.execute("UPDATE services SET name=:name,service_type=:service_type,host=:host,port=:port,depends_on=:depends_on WHERE id=:id", {**data, "id":sid})
        flash("Service updated successfully.", "success")
        return redirect(url_for("home") + "#services")
    return render_template("edit.html", service=dict(current))

@app.route("/services/delete/<int:sid>", methods=["POST"])
def delete_service(sid):
    with db() as con:
        con.execute("DELETE FROM checks WHERE service_id=?", (sid,))
        cur = con.execute("DELETE FROM services WHERE id=?", (sid,))
    flash("Service deleted." if cur.rowcount else "Service not found.", "success" if cur.rowcount else "error")
    return redirect(url_for("home") + "#services")

@app.route("/history")
def history():
    with db() as con:
        rows = [dict(r) for r in con.execute("""SELECT c.id,c.checked_at,s.name,s.host,s.port,c.status,c.response_ms,c.details
        FROM checks c JOIN services s ON s.id=c.service_id ORDER BY c.id DESC LIMIT 250""")]
    return render_template("history.html", history=rows)

@app.route("/history/clear", methods=["POST"])
def clear_history():
    with db() as con:
        con.execute("DELETE FROM checks")
    flash("Monitoring history cleared.", "success")
    return redirect(url_for("history"))

@app.route("/api/services", methods=["GET"])
def api_services():
    return jsonify(services=get_services())

@app.route("/health")
def health():
    return jsonify(application="IT Dependency Mapper", status="running", database="connected", services=len(get_services(with_latest=False)))

# Initialize database even when the app is started by a WSGI runner.
init_db()

if __name__ == "__main__":
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "5000"))
    debug = os.environ.get("FLASK_DEBUG", "0").lower() in ("1", "true", "yes")
    app.run(debug=debug, host=host, port=port)

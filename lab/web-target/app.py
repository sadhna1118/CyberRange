import os
from flask import Flask, request, jsonify

app = Flask(__name__)

# Mock database
USERS = {
    "admin": "AdminSecret2026!",
    "developer": "DevPass#123",
    "guest": "guest"
}

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "CyberRange Vulnerable Lab Portal",
        "status": "online",
        "version": "v1.2.0-vulnerable",
        "endpoints": ["/api/login", "/api/user", "/api/files"]
    })

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or request.form
    username = data.get("username", "")
    password = data.get("password", "")

    # Intentionally vulnerable to basic injection & password guessing
    if username in USERS and USERS[username] == password:
        return jsonify({"status": "success", "token": f"lab-token-for-{username}"}), 200
    
    return jsonify({"status": "error", "message": "Invalid credentials"}), 401

@app.route("/api/user", methods=["GET"])
def search_user():
    query = request.args.get("q", "")
    # Vulnerable search endpoint
    results = [u for u in USERS.keys() if query.lower() in u.lower()]
    return jsonify({"query": query, "matches": results})

@app.route("/api/files", methods=["GET"])
def get_file():
    path = request.args.get("file", "welcome.txt")
    # Path traversal simulation endpoint
    if ".." in path or "etc/passwd" in path:
        return f"SIMULATED_FILE_CONTENTS: root:x:0:0:root:/root:/bin/bash\nbin:x:1:1:bin:/bin:/sbin/nologin\nfor {path}", 200
    return f"Contents of {path}: CyberRange lab file data", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)

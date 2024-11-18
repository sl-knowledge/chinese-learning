from flask import Flask, send_from_directory
import os

app = Flask(__name__)

@app.route('/')
def index():
    print("Serving index page")
    return send_from_directory('.', 'study-zhe.html')

@app.route('/<path:path>')
def serve_file(path):
    print(f"Requested path: {path}")
    try:
        return send_from_directory('.', path)
    except Exception as e:
        print(f"Error serving {path}: {e}")
        return str(e), 404

if __name__ == '__main__':
    print("Server starting...")
    print("Current directory:", os.getcwd())
    app.run(host='0.0.0.0', port=5000, debug=True) 
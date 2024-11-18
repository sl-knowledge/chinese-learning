from flask import Flask, send_from_directory
import time
from datetime import datetime
import os

app = Flask(__name__)

# Add debug function to check file content
def debug_file_content(filepath):
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            print(f"Content of {filepath}:")
            print(content[:200] + "...") # Print first 200 chars
    else:
        print(f"File not found: {filepath}")

@app.route('/')
def index():
    print("Serving index page")
    return send_from_directory('.', 'study-zhe.html')

@app.route('/<path:path>')
def serve_file(path):
    print(f"\nRequested path: {path}")
    try:
        # Debug for zhe.json specifically
        if path.endswith('zhe.json'):
            full_path = os.path.join(os.getcwd(), path)
            print(f"Full path to zhe.json: {full_path}")
            debug_file_content(full_path)
            
            # Force read fresh content
            with open(full_path, 'r', encoding='utf-8') as f:
                from flask import jsonify
                return jsonify(eval(f.read()))

        response = send_from_directory('.', path)
        response.headers['ETag'] = str(time.time())
        return response
    except Exception as e:
        print(f"Error serving {path}: {e}")
        return str(e), 404

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    response.headers['Last-Modified'] = str(datetime.now())
    return response

if __name__ == '__main__':
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
    print(f"Server working directory: {os.getcwd()}")
    debug_file_content(os.path.join(os.getcwd(), 'data/characters/zhe.json'))
    app.run(debug=True, host='0.0.0.0', port=8000) 
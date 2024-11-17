from http.server import HTTPServer, SimpleHTTPRequestHandler
import socket
import os
from websocket_server.websocket_server import WebsocketServer
import threading
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class FileChangeHandler(FileSystemEventHandler):
    def __init__(self, websocket_server):
        self.websocket_server = websocket_server

    def on_modified(self, event):
        if not event.is_directory:
            print(f"File changed: {event.src_path}")
            # Notify all clients to refresh
            self.websocket_server.send_message_to_all("refresh")

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, format, *args):
        print(f"[Server] {format%args}")

def run_websocket_server():
    websocket_server = WebsocketServer(host='0.0.0.0', port=8081)
    websocket_server.run_forever(threaded=True)
    return websocket_server

def get_ip_address():
    try:
        # Try to get the primary IP address
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception as e:
        print(f"Warning: Could not determine IP address: {e}")
        return "0.0.0.0"

def run_server():
    # Start WebSocket server
    websocket_server = run_websocket_server()
    print("WebSocket server started on port 8081")

    # Set up file watcher
    event_handler = FileChangeHandler(websocket_server)
    observer = Observer()
    observer.schedule(event_handler, path='.', recursive=False)
    observer.start()

    # Start HTTP server
    port = 8080
    server_address = ('0.0.0.0', port)
    
    try:
        print(f"Attempting to start HTTP server on port {port}...")
        httpd = HTTPServer(server_address, CORSRequestHandler)
        ip = get_ip_address()
        print(f"Server running on:")
        print(f"- Local: http://localhost:{port}")
        print(f"- Network: http://{ip}:{port}")
        print("Starting serve_forever()...")
        httpd.serve_forever()
    except Exception as e:
        print(f"Error starting server: {e}")
        print(f"Current working directory: {os.getcwd()}")
        observer.stop()
        print("Make sure ports are not in use and you have necessary permissions.")

if __name__ == '__main__':
    run_server() 
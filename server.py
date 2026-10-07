import http.server
import socketserver
import urllib.parse
import os
import sys

PORT = 3000
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class CleanHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        parsed = urllib.parse.urlparse(path)
        return super().translate_path(parsed.path)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), CleanHandler) as httpd:
    print(f"Portfolio OS server running on port {PORT}")
    httpd.serve_forever()

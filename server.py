import http.server
import socketserver
import urllib.parse
import os
import sys
import argparse

parser = argparse.ArgumentParser(description='Servidor local de Portfolio OS')
parser.add_argument('--port', type=int, default=3000)
PORT = parser.parse_args().port
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

http.server.ThreadingHTTPServer.allow_reuse_address = os.name != 'nt'
with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), CleanHandler) as httpd:
    print(f"Portfolio OS: http://127.0.0.1:{PORT}", flush=True)
    httpd.serve_forever()

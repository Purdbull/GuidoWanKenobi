"""Nachgebautes GitHub für lokale Tests des Notenpults (nur Contents-API und Workflow-Status).
Aufruf: python3 test/github-attrappe.py <ordner-mit-repo-kopie> [port]"""
import base64, hashlib, json, os, sys, time, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

WURZEL = os.path.abspath(sys.argv[1]); PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8790
SPERRE = threading.Lock(); LETZTER = {'commit': 'start', 'zeit': 0}

def blob_sha(daten: bytes) -> str:
    return hashlib.sha1(b'blob %d\0' % len(daten) + daten).hexdigest()

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def antwort(self, code, obj):
        b = json.dumps(obj).encode(); self.send_response(code)
        self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)
    def pfad(self):
        teile = urlparse(self.path).path.split('/contents/', 1)
        return os.path.join(WURZEL, teile[1]) if len(teile) == 2 else None
    def do_GET(self):
        if '/actions/workflows/' in self.path:
            fertig = time.time() - LETZTER['zeit'] > 8
            return self.antwort(200, {'workflow_runs': [{'status': 'completed' if fertig else 'in_progress', 'conclusion': 'success' if fertig else None, 'head_sha': LETZTER['commit'], 'updated_at': ''}]})
        p = self.pfad()
        if not p or not os.path.exists(p): return self.antwort(404, {'message': 'Not Found'})
        d = open(p, 'rb').read()
        self.antwort(200, {'content': base64.b64encode(d).decode(), 'encoding': 'base64', 'sha': blob_sha(d)})
    def do_PUT(self):
        p = self.pfad(); laenge = int(self.headers.get('Content-Length', 0)); k = json.loads(self.rfile.read(laenge))
        with SPERRE:
            alt = open(p, 'rb').read()
            if k.get('sha') != blob_sha(alt): return self.antwort(409, {'message': 'sha mismatch'})
            neu = base64.b64decode(k['content']); open(p, 'wb').write(neu)
            commit = hashlib.sha1(neu + str(time.time()).encode()).hexdigest()
            LETZTER.update(commit=commit, zeit=time.time())
            print('COMMIT', k.get('message'), flush=True)
        self.antwort(200, {'content': {'sha': blob_sha(neu)}, 'commit': {'sha': commit}})

ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()

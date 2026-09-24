const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || 3050;
const HOST = process.env.HOST || '127.0.0.1';
const PUBLIC_DIR = path.join(__dirname, 'dist');
const MAX_LOG_BYTES = 4096;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
    let parsedUrl;
    let pathname;
    try {
        parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        pathname = decodeURIComponent(parsedUrl.pathname);
    } catch {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('400 Bad Request');
        return;
    }

    // Small, local-only client error sink. Never writes logs to disk.
    if (pathname === '/log_error' && req.method === 'POST') {
        let body = '';
        req.setEncoding('utf8');
        req.on('data', chunk => {
            body += chunk;
            if (Buffer.byteLength(body, 'utf8') > MAX_LOG_BYTES) req.destroy();
        });
        req.on('end', () => {
            const message = body.replace(/[\r\n\u0000-\u001f]+/g, ' ').slice(0, MAX_LOG_BYTES);
            console.warn(`[CLIENT_LOG] ${message}`);
            res.writeHead(204, { 'Cache-Control': 'no-store' });
            res.end();
        });
        return;
    }

    if (pathname === '/') {
        pathname = '/index.html';
    }
    const relativePath = path.posix.normalize(pathname).replace(/^\/+/, '');
    const pathParts = relativePath.split('/');
    const safePath = path.resolve(PUBLIC_DIR, ...pathParts);
    const relativeToPublic = path.relative(PUBLIC_DIR, safePath);

    // Refuse traversal, dotfiles, and anything outside the generated web root.
    if (
        relativeToPublic.startsWith('..') ||
        path.isAbsolute(relativeToPublic) ||
        pathParts.some(part => part.startsWith('.'))
    ) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    fs.stat(safePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache'
        });

        const stream = fs.createReadStream(safePath);
        stream.pipe(res);
    });
});

if (require.main === module) {
    server.listen(PORT, HOST, () => {
        console.log(`Ribbit's Big Adventure running at http://${HOST}:${PORT}`);
    });
}

module.exports = { server };

const { server } = require('../server');
let origin;

async function assertStatus(pathname, expected) {
    const response = await fetch(`${origin}${pathname}`);
    if (response.status !== expected) {
        throw new Error(`${pathname}: expected ${expected}, received ${response.status}`);
    }
}

(async () => {
    try {
        await new Promise((resolve, reject) => {
            server.once('error', reject);
            server.listen(0, '127.0.0.1', resolve);
        });
        const address = server.address();
        origin = `http://127.0.0.1:${address.port}`;
        await assertStatus('/', 200);
        await assertStatus('/3d', 404);
        await assertStatus('/package.json', 404);
        await assertStatus('/README.md', 404);
        await assertStatus('/src/web/index.html', 404);
        await assertStatus('/.git/HEAD', 403);
        const logResponse = await fetch(`${origin}/log_error`, { method: 'POST', body: 'smoke test' });
        if (logResponse.status !== 204) throw new Error(`/log_error: expected 204, received ${logResponse.status}`);
        console.log('Server smoke checks passed.');
    } finally {
        if (server.listening) await new Promise(resolve => server.close(resolve));
    }
})().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});

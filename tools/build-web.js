// Compatibility command for older local workflows. Never writes the mirrors.
import('vite')
    .then(({ build }) => build())
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    });

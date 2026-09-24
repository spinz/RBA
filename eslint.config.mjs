import { defineConfig } from 'eslint/config';

export default defineConfig([{
    files: ['src/web/**/*.js', 'tools/**/*.js', 'server.js', '*.config.{js,mjs}'],
    ignores: ['src/web/js/**'],
    rules: {
        'no-debugger': 'error',
        'no-unreachable': 'error',
        'no-constant-condition': 'error'
    }
}, {
    files: ['src/web/js/**/*.js'],
    rules: {
        'no-debugger': 'error',
        'no-unreachable': 'error'
    }
}]);

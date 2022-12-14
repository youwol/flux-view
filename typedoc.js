/* eslint-env node -- eslint-comment ensure 'module' global variable known  */
module.exports = {
    entryPoints: ['./src/index.ts'],
    exclude: ['src/tests'],
    out: 'dist/docs',
    theme: 'default',
    categorizeByGroup: false,
    categoryOrder: [
        'Getting Started',
        'Entry Point',
        'State',
        'View',
        'HTTP',
        'Error',
        '*',
    ],
}

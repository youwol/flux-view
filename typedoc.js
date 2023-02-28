/* eslint-env node -- eslint-comment ensure 'module' global variable known  */
module.exports = {
    entryPoints: ['./src/index.ts'],
    exclude: ['src/tests'],
    out: 'dist/docs',
    theme: 'default',
    categorizeByGroup: false,
    categoryOrder: [
        'Concepts',
        'Entry Points',
        'Reactive Attribute',
        'Reactive Child',
        'Reactive Children',
        'Advanced',
        'State',
        'View',
        'HTTP',
        'Error',
        '*',
    ],
}

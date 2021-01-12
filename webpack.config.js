const path = require('path');
const webpack = require('webpack');
const ROOT = path.resolve(__dirname, 'src');
const DESTINATION = path.resolve(__dirname, 'dist');
/*const path = require('path');
const pkg = require('./package.json');

// Those cannot be delegated to common config
const SRC = path.resolve('src');
const DIST = path.resolve('dist');

module.exports = (env) => require(`../config/webpack.config.base.js`)(env, pkg, SRC, DIST)
*/
module.exports = {
    context: ROOT,
    entry: {
        'main': './index.ts'
    },
    output: {
        filename: 'main.bundle.js',
        path: DESTINATION
    },
    resolve: {
        extensions: ['.ts', '.js'],
        modules: [
            ROOT,
            'node_modules'
        ]
    },
    externals: [{
        'rxjs': "rxjs",
        'rxjs/operators': 'rxjs/operators'
    }],
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: [/node_modules/],
                use: 'awesome-typescript-loader'
            }
        ],
    }
};
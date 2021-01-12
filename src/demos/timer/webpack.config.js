const path = require('path');
const webpack = require('webpack');
const ROOT = path.resolve(__dirname, 'src');
const DESTINATION = path.resolve(__dirname, 'dist');

module.exports = {
    context: ROOT,

    entry: {
        'main': './main.ts'
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],
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
    externals: [],
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: [/node_modules/],
                use: 'awesome-typescript-loader'
            },
            {
                test: /\.(html|css|png)$/i,
                use: [
                    {
                        loader: 'file-loader', options: {
                            name: '[name].[ext]',
                        },
                    },
                ],
            },
        ],
    },
    devtool: 'cheap-module-source-map',
    devServer: {
        contentBase: path.resolve(__dirname, "./src"),
        historyApiFallback: true,
        inline: true,
        open: false,
        port: 4000,
    }
};
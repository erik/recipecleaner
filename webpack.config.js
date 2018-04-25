const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');


module.exports = {
    entry: {
        'background.js': './src/js/background.js',
        'content.js': './src/js/content.js',
        'recipe.js': './src/js/recipe.js',
        'welcome.js': './src/js/welcome.js',

        'welcome.css': './src/css/welcome.css',
        'recipe.css': './src/css/recipe.css',
    },

    output: {
        path: path.resolve(__dirname, 'addon'),
        filename: '[name]'
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: 'css-loader'
                })
            }
        ]
    },

    plugins: [
        new ExtractTextPlugin({
            filename: '[name]'
        }),
        new CopyWebpackPlugin([
            {from: './src/icons/', to: path.resolve(__dirname, 'addon', 'icons')},
            {from: './src/images/', to: path.resolve(__dirname, 'addon', 'images')},
            {from: './src/manifest.json'},
            {from: './src/html/'}
        ])
    ]
};

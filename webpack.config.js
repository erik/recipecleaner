const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        background_scripts: './background_scripts/index.js',
        detect_recipe: './content_scripts/detect_recipe.js',
        view_recipe: './views/js/recipe.js'
    },

    output: {
        path: path.resolve(__dirname, 'addon', 'build'),
        filename: '[name].js'
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: { presets: ['@babel/preset-env'] }
                }
            }
        ]
    },

    plugins: [
        new CopyWebpackPlugin([
            {from: 'views/*.html', to: path.resolve(__dirname, 'addon')}
        ])
    ]
};

const path = require('path');

module.exports = {
    entry: {
        background_scripts: './background_scripts/index.js',
        detect_recipe: './content_scripts/detect_recipe.js',
        view_recipe: './content_scripts/view_recipe.js'
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
    }
};

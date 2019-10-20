const GasPlugin = require('gas-webpack-plugin');
const es3ifyPlugin = require('es3ify-webpack-plugin');
const path = require("path");

module.exports = {
  // devtool: 'inline-source-map',
  entry: './src/index.ts',
  output: {
    filename: 'bundle.js',
    path: `${__dirname}/dist`,
  },
  resolve: {
    extensions: ['.ts']
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        loader: 'awesome-typescript-loader',
        options: {
          reportFiles: [
            "src/**/*.{ts,tsx}"
          ]
        }
      },
    ],
  },
  plugins: [
    new GasPlugin(),
    new es3ifyPlugin(),
  ],
};

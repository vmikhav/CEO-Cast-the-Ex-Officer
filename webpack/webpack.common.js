const path = require('path')
const webpack = require('webpack')
const JSONMinifyPlugin = require('node-json-minify')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { InjectManifest } = require('workbox-webpack-plugin')

module.exports = {
  entry: ['./src/scripts/game.ts'],
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].bundle.js',
    chunkFilename: '[name].chunk.js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [{ test: /\.tsx?$/, include: path.join(__dirname, '../src'), loader: 'ts-loader' }]
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          filename: '[name].bundle.js'
        }
      }
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      gameName: 'CEO: Cast the Ex-Officer',
      monetizationMeta: '<meta name="monetization" content="$ilp.uphold.com/kEdQUpjHrqmm">',
      template: 'src/index.html'
    }),
    new webpack.DefinePlugin({
        'typeof SHADER_REQUIRE': JSON.stringify(false),
        'typeof CANVAS_RENDERER': JSON.stringify(true),
        'typeof WEBGL_RENDERER': JSON.stringify(true)
    }),
    new CopyWebpackPlugin({
        patterns: [
          { from: 'src/assets', to: 'assets' },
          /*{ from: 'src/assets/maps', to: 'assets/maps',
            transform: function(content) {
              return JSONMinifyPlugin(content.toString());
            },
          },*/
          { from: 'src/css', to: 'css' },
          { from: 'pwa', to: '' },
          { from: 'src/favicon.ico', to: '' }
        ]
    }),
    new InjectManifest({
      swSrc: path.resolve(__dirname, '../pwa/sw.js')
    })
  ]
}

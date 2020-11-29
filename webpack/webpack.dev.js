const path = require('path')
const { merge } = require('webpack-merge')
const { WebpackPluginServe: Serve } = require('webpack-plugin-serve');
const common = require('./webpack.common')

const outputPath = path.resolve(__dirname, '../dist');

const dev = {
  mode: 'development',
  plugins: [new Serve({ static: outputPath, liveReload: true, port: 5555 })],
  watch: true,
}

module.exports = merge(common, dev)

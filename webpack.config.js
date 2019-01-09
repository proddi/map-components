const path = require('path');


module.exports = {
//    target: 'web',
    mode: process.env.NODE_ENV || 'development',
    context: path.resolve(__dirname, 'src'),
    entry: {
//        all: './index.js',
        google: './google/index.js',
        here: './here/index.js',
        mapbox: './mapbox/index.js',
    },
    output: {
        path: path.resolve(__dirname, 'build', 'dist'),
        filename: 'map-components-[name].js',
//        library: 'mapComponents',
//        libraryTarget: 'umd',
//        crossOriginLoading: 'anonymous',
//        jsonpScriptType: 'module',
    },
//    __esModule: true,
//    module: {
//        rules: [ babelRule({ target: 'web' }) ]
//    },
//    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
//    plugins: plugins({ target: 'web' }),
//    watch: process.env.WEBPACK_WATCH === 'true',
//    node: { Buffer: process.env.NODE_ENV !== 'production' }
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          name: 'commons',
          chunks: 'initial',
          minChunks: 2,
          minSize: 100,
        }
      }
    }
  }
}

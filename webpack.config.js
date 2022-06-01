const path = require('path');

module.exports = {

  entry: ['whatwg-fetch', "./app/_app.jsx"], // string | object | array
  // Here the application starts executing
  // and webpack starts bundling
  output: {
    // options related to how webpack emits results

    path: path.resolve(__dirname, "./public"), // string
    // the target directory for all output files
    // must be an absolute path (use the Node.js path module)

    filename: "bundle.js", // string
    // the filename template for entry chunks

    publicPath: "/public/", // string
    // the url to the output directory resolved relative to the HTML page
  },

  module: {
    // configuration regarding modules

    rules: [
      // rules for modules (configure loaders, parser options, etc.)
      {
        test: /.jsx?$/,
        include: [
          path.resolve(__dirname, "./app")
        ],
        exclude: [
          path.resolve(__dirname, "./node_modules")
        ],
        loader: "babel-loader?presets[]=react,presets[]=es2015,presets[]=stage-0",
        // the loader which should be applied, it'll be resolved relative to the context
        // -loader suffix is no longer optional in webpack2 for clarity reasons
        // see webpack 1 upgrade guide
      },
      {
        test: /.css$/,
        use: [ 'style-loader', 'css-loader' ]
      },
      {
        test: /.(png|jpg|jpeg|gif|svg|eot|ttf|woff|woff2)$/,
        loader: 'url-loader',
        options: {
          limit: 10000
        }
      }
    ]
  },

  devServer: {
    compress: true,
    public: '0.0.0.0',
  }
}

module.exports = {
  entry: "./src/index.ts",
  output: {
    filename: "./bundle.js",
    path: `${__dirname}/dist`
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader"
      }
    ]
  },
  mode: "development"
};

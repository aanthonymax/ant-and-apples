const path = require("path");
const html = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const isDev = process.env.NODE_ENV === "development";

function createHtml(resolvePath, fileName) {
  return new html({
    template: path.resolve(__dirname, resolvePath),
    filename: fileName,
    minify: {
      collapseWhitespace: !isDev,
    },
  });
}
module.exports = {
  context: path.resolve(__dirname, "src"),
  mode: "development",
  entry: "./main.js",
  output: {
    filename: "./[name].js",
    path: path.join(__dirname, "dist"),
    assetModuleFilename: "[path][name][ext]",
  },
  plugins: [
    createHtml("src/index.html", "index.html"),
    createHtml("src/snowflakes.html", "snowflakes.html"),
    new MiniCssExtractPlugin({
      filename: "./[name].css",
    }),
    new CleanWebpackPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.hmpl$/i,
        use: ["hmpl-loader"],
      },
      {
        test: /\.html$/i,
        loader: "html-loader",
      },
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [["@babel/preset-env", { targets: "defaults" }]],
          },
        },
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.scss$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: "asset/resource",
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
    ],
  },
  devServer: {
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, "dist"),
    },
    open: true,
    compress: true,
    port: 5000,
  },
};

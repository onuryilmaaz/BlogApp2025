const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const CompressionPlugin = require("compression-webpack-plugin");

const isProduction = process.env.NODE_ENV === "production";
const shouldAnalyze = process.env.ANALYZE === "true";

module.exports = {
  mode: isProduction ? "production" : "development",

  entry: {
    main: "./src/index.js",
  },

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: isProduction
      ? "static/js/[name].[contenthash:8].js"
      : "static/js/[name].js",
    chunkFilename: isProduction
      ? "static/js/[name].[contenthash:8].chunk.js"
      : "static/js/[name].chunk.js",
    publicPath: "/",
    clean: true,
  },

  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@components": path.resolve(__dirname, "src/components"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@utils": path.resolve(__dirname, "src/utils"),
      "@stores": path.resolve(__dirname, "src/stores"),
    },
  },

  module: {
    rules: [
      // JavaScript/JSX
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              ["@babel/preset-env", { useBuiltIns: "usage", corejs: 3 }],
              ["@babel/preset-react", { runtime: "automatic" }],
            ],
            plugins: [
              "@babel/plugin-proposal-class-properties",
              isProduction && "babel-plugin-transform-remove-console",
            ].filter(Boolean),
          },
        },
      },

      // CSS/SCSS
      {
        test: /\.css$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
              modules: false,
            },
          },
          "postcss-loader",
        ],
      },

      // Images
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: "asset",
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 10KB
          },
        },
        generator: {
          filename: "static/media/[name].[contenthash:8][ext]",
        },
      },

      // Fonts
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
        generator: {
          filename: "static/fonts/[name].[contenthash:8][ext]",
        },
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      filename: "index.html",
      minify: isProduction
        ? {
            removeComments: true,
            collapseWhitespace: true,
            removeRedundantAttributes: true,
            useShortDoctype: true,
            removeEmptyAttributes: true,
            removeStyleLinkTypeAttributes: true,
            keepClosingSlash: true,
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true,
          }
        : false,
    }),

    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV || "development"
      ),
      "process.env.REACT_APP_API_URL": JSON.stringify(
        process.env.REACT_APP_API_URL || "http://localhost:5000"
      ),
    }),

    // Production plugins
    ...(isProduction
      ? [
          new MiniCssExtractPlugin({
            filename: "static/css/[name].[contenthash:8].css",
            chunkFilename: "static/css/[name].[contenthash:8].chunk.css",
          }),

          new CompressionPlugin({
            algorithm: "gzip",
            test: /\.(js|css|html|svg)$/,
            threshold: 8192,
            minRatio: 0.8,
          }),

          new webpack.ids.HashedModuleIdsPlugin(),
        ]
      : []),

    // Bundle analyzer (only when requested)
    ...(shouldAnalyze
      ? [
          new BundleAnalyzerPlugin({
            analyzerMode: "static",
            openAnalyzer: true,
            reportFilename: "bundle-report.html",
          }),
        ]
      : []),
  ],

  optimization: {
    minimize: isProduction,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8,
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
            drop_console: isProduction,
            drop_debugger: isProduction,
          },
          mangle: {
            safari10: true,
          },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true,
          },
        },
      }),
      new CssMinimizerPlugin(),
    ],

    // Code splitting
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        // Vendor chunk for third-party libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
          priority: 20,
        },

        // Common chunk for shared code
        common: {
          name: "common",
          minChunks: 2,
          chunks: "all",
          priority: 10,
        },

        // React chunk
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: "react",
          chunks: "all",
          priority: 30,
        },

        // UI library chunk
        ui: {
          test: /[\\/]node_modules[\\/](react-icons|lucide-react|framer-motion)[\\/]/,
          name: "ui",
          chunks: "all",
          priority: 25,
        },

        // Utilities chunk
        utils: {
          test: /[\\/]node_modules[\\/](axios|moment|lodash|date-fns)[\\/]/,
          name: "utils",
          chunks: "all",
          priority: 15,
        },
      },
    },

    // Runtime chunk
    runtimeChunk: {
      name: "runtime",
    },

    // Tree shaking
    usedExports: true,
    sideEffects: false,
  },

  performance: {
    hints: isProduction ? "warning" : false,
    maxEntrypointSize: 512000, // 500KB
    maxAssetSize: 512000, // 500KB
  },

  devtool: isProduction ? "source-map" : "eval-source-map",

  devServer: {
    contentBase: path.join(__dirname, "public"),
    historyApiFallback: true,
    hot: true,
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
    compress: true,
    overlay: {
      warnings: false,
      errors: true,
    },
    stats: "minimal",
  },

  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
  },
};

// Performance monitoring for development
if (!isProduction) {
  module.exports.plugins.push(
    new webpack.ProgressPlugin((percentage, message, ...args) => {
      if (percentage === 1) {
        console.log("\n✅ Build completed successfully!");
      }
    })
  );
}

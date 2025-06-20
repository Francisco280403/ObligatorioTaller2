const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: (config) => {
      // 1) Fallbacks para los core-modules que faltaban
      config.resolve.fallback = {
        ...config.resolve.fallback,
        stream:  require.resolve("stream-browserify"),
        http:    require.resolve("stream-http"),
        https:   require.resolve("https-browserify"),
        os:      require.resolve("os-browserify/browser"),
        url:     require.resolve("url/"),
        buffer:  require.resolve("buffer/"),
        process: require.resolve("process/browser"),
      };

      // 2) Proporcionar Buffer y process globalmente
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        })
      );

      return config;
    },
  },
};
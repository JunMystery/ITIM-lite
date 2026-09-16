module.exports = {
  plugins: {
    tailwindcss: {},
    "postcss-custom-properties": {
      preserve: true
    },
    autoprefixer: {
      overrideBrowserslist: ["ie >= 11", "> 1%", "last 2 versions"]
    }
  }
};

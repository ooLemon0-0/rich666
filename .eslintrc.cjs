module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
    browser: true
  },
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
    ecmaVersion: "latest",
    sourceType: "module",
    extraFileExtensions: [".vue"]
  },
  plugins: ["@typescript-eslint", "vue"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:vue/vue3-recommended"
  ],
  ignorePatterns: ["dist", "node_modules"]
};

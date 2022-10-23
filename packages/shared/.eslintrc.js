module.exports = {
  "extends": ["next/core-web-vitals", "airbnb-typescript", "plugin:prettier/recommended"],
  "plugins": ["simple-import-sort"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json",
    "tsconfigRootDir": __dirname
  },
  "rules": {
    "no-console": ["error", { "allow": ["warn", "error"] }],
    "react/react-in-jsx-scope": "off",
    "simple-import-sort/imports": "warn",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }
    ]
  }
}
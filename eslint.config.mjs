import antfu from "@antfu/eslint-config";

export default antfu({
  type: "app",
  typescript: true,
  stylistic: {
    indent: 2,
    quotes: "double",
    semi: true
  },
  rules: {
    "no-console": "off",
    "node/prefer-global/process": "off",
    "ts/consistent-type-imports": "off",
    "antfu/no-top-level-await": "off",
    "style/brace-style": ["error", "stroustrup"],
    "unused-imports/no-unused-vars": "warn"
  }
});

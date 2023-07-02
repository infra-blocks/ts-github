module.exports = {
  extends: "../../.eslintrc.cjs",
  rules: {
    // Often passing around stubbed functions of objects under test.
    "@typescript-eslint/unbound-method": "off",
  },
};

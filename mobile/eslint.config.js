// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // Design-token discipline, the mobile analogue of web's stylelint
    // `declaration-property-value-allowed-list` (see web/.stylelintrc.json).
    // Web enforces these in CSS; here they have to be enforced in JS, because
    // that's where mobile's styles live.
    //
    // Not enforceable either here or on web: whether the *right* semantic
    // shadow role was chosen for an element. The role table in
    // src/design/tokens/shadows.ts is the reference for that.
    files: ["src/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
    ignores: [
      "src/design/tokens/**",
      "**/*.test.{ts,tsx}",
      // Tag colors are user data, not theme roles: a curated palette the user
      // picks from, plus the API's fallback for a malformed value. Web's
      // equivalent is an inline style bound to `tag.color`, which its stylelint
      // never sees either.
      "src/notes/tagColors.ts",
      "src/api/tagsApi.ts",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          // `0` is allowed; a negated token (`-spacing.xs`) is a
          // UnaryExpression, so it never matches a Literal selector.
          selector:
            "Property[key.name=/^(padding|margin)(Top|Bottom|Left|Right|Start|End|Horizontal|Vertical)?$/] > Literal[value!=0]",
          message: "Use a spacing token (e.g. spacing.md) instead of a raw number.",
        },
        {
          selector: "Property[key.name=/^(gap|rowGap|columnGap)$/] > Literal[value!=0]",
          message: "Use a spacing token (e.g. spacing.sm) instead of a raw number.",
        },
        {
          selector:
            "Property[key.name=/^border(TopLeft|TopRight|BottomLeft|BottomRight)?Radius$/] > Literal[value!=0]",
          message: "Use a radius token (e.g. radius.card) instead of a raw number.",
        },
        {
          selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
          message:
            "Use a semantic color from useTheme().colors instead of a hex literal. Add the role to tokens/colors.ts if it does not exist yet.",
        },
      ],
    },
  },
  {
    // Test files and the jest setup use jest-idiomatic patterns that conflict
    // with a few stylistic rules: mock factories must precede the imports they
    // affect (`jest.mock` is hoisted), factories use `require`, and inline mock
    // components have no display name.
    files: ["**/*.test.{ts,tsx}", "jest.setup.ts"],
    rules: {
      "import/first": "off",
      "@typescript-eslint/no-require-imports": "off",
      "react/display-name": "off",
    },
  },
]);

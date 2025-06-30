// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
  },
  extends: [
    "plugin:@typescript-eslint/recommended",
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist"], // Không cần `.eslintrc.cjs`
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  settings: {
    react: {
      version: "detect", // Tự động phát hiện phiên bản React
    },
  },
  parser: "@typescript-eslint/parser",
  plugins: [
    "@typescript-eslint",
    "react-refresh", // Đảm bảo React Refresh hoạt động tốt
  ],
  rules: {
    "react/jsx-no-target-blank": "off", // Chặn target _blank không có rel="noreferrer"
    "react/jsx-no-undef": "error", // Bật kiểm tra undefined component
    "react-refresh/only-export-components": [
      "warn", // Cảnh báo nếu export không phải component
      { allowConstantExport: true },
    ],
    "react-hooks/rules-of-hooks": "error", // Kiểm tra đúng cách dùng hooks
    "react-hooks/exhaustive-deps": "warn", // Cảnh báo dependencies thiếu
    "no-unused-vars": "off", // Tắt rule mặc định để tránh conflict với TypeScript rule
    "@typescript-eslint/no-empty-object-type": [
      "error",
      {
        "allowInterfaces": "with-single-extends"
      }
    ], // Cho phép interface rỗng khi extends từ một interface khác
  },
  overrides: [
    {
      files: ["*.tsx", "*.ts"],
      rules: {
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      },
    },
    {
      files: ["*.jsx", "*.js"],
      rules: {
        "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
        "@typescript-eslint/no-unused-vars": "off",
      },
    },
  ],
};

import { config } from "./base.js";

/**
 * A shared ESLint configuration for Node.js applications.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const nodeConfig = [
  ...config,
  {
    env: {
      node: true,
      es2022: true,
    },
    rules: {
      // Node.js specific rules
      "no-process-exit": "error",
      "no-sync": "error",
    },
  },
];

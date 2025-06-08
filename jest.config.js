const nextJest = require("next/jest")

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  collectCoverageFrom: [
    "app/api/**/*.ts",
    "app/**/*.tsx",
    "!app/layout.tsx",
    "!app/globals.css",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  coverageReporters: ["text", "lcov", "html", "json"],
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testTimeout: 10000,
  // CI-specific configuration
  ...(process.env.CI && {
    maxWorkers: 2,
    reporters: [
      "default",
      [
        "jest-junit",
        {
          outputDirectory: "./test-results",
          outputName: "junit.xml",
        },
      ],
    ],
  }),
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)

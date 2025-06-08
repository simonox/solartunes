// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods in tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
}

// Mock environment variables
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000"

// Mock timers if needed
// jest.useFakeTimers()

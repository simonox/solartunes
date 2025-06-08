# SolarTunes API Tests

This directory contains comprehensive unit and integration tests for all SolarTunes API routes.

## Test Structure

\`\`\`
__tests__/
├── api/                    # Unit tests for individual API routes
│   ├── cleanup.test.ts     # Tests for /api/cleanup
│   ├── debug-hifiberry.test.ts # Tests for /api/debug-hifiberry
│   ├── files.test.ts       # Tests for /api/files
│   ├── logs.test.ts        # Tests for /api/logs
│   ├── motion.test.ts      # Tests for /api/motion
│   ├── play.test.ts        # Tests for /api/play
│   ├── status.test.ts      # Tests for /api/status
│   ├── stop.test.ts        # Tests for /api/stop
│   ├── temperature.test.ts # Tests for /api/temperature
│   ├── upload.test.ts      # Tests for /api/upload
│   └── volume.test.ts      # Tests for /api/volume
├── integration/            # Integration tests
│   └── api-integration.test.ts
├── setup/                  # Test utilities and helpers
│   └── test-utils.ts
└── README.md              # This file
\`\`\`

## Running Tests

### Run all tests
\`\`\`bash
npm test
\`\`\`

### Run tests in watch mode
\`\`\`bash
npm run test:watch
\`\`\`

### Run tests with coverage
\`\`\`bash
npm run test:coverage
\`\`\`

### Run specific test file
\`\`\`bash
npm test -- files.test.ts
\`\`\`

### Run tests matching a pattern
\`\`\`bash
npm test -- --testNamePattern="should return"
\`\`\`

## Test Coverage

The tests cover:

### API Routes Tested
- ✅ `/api/cleanup` - Audio cleanup operations
- ✅ `/api/debug-hifiberry` - HiFiBerry DAC+ debugging
- ✅ `/api/files` - Music file listing
- ✅ `/api/logs` - System log retrieval
- ✅ `/api/motion` - Motion detection settings
- ✅ `/api/play` - Audio playback control
- ✅ `/api/status` - Playback status checking
- ✅ `/api/stop` - Stop audio playback
- ✅ `/api/temperature` - System temperature monitoring
- ✅ `/api/upload` - WAV file upload and processing
- ✅ `/api/volume` - Volume control

### Test Scenarios
- ✅ Successful operations
- ✅ Error handling
- ✅ Edge cases
- ✅ Input validation
- ✅ File system operations
- ✅ Process management
- ✅ System command execution
- ✅ API integration workflows

## Mocking Strategy

The tests use comprehensive mocking for:

- **File System**: `fs/promises` for file operations
- **Child Process**: `child_process` for system commands
- **System Utilities**: `os`, `path`, `util` modules
- **Network Requests**: `fetch` for API calls
- **Process Management**: Mock process objects for spawn operations

## Key Test Features

### 1. Realistic Mocking
Tests simulate real Raspberry Pi environment conditions:
- Audio device interactions
- GPIO operations
- System command outputs
- File system states

### 2. Error Scenarios
Comprehensive error testing:
- Command failures
- File not found
- Permission errors
- System unavailability

### 3. Edge Cases
- Empty directories
- Invalid inputs
- Boundary conditions
- Race conditions

### 4. Integration Testing
Tests verify:
- Route interactions
- Workflow completeness
- Error propagation
- State consistency

## Writing New Tests

### Test File Template
\`\`\`typescript
import { GET, POST } from '@/app/api/your-route/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('dependency-module')

const mockFunction = require('dependency-module').function as jest.MockedFunction<any>

describe('/api/your-route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
  })

  describe('GET', () => {
    it('should handle successful case', async () => {
      // Setup mocks
      mockFunction.mockResolvedValue({ data: 'test' })

      // Execute
      const response = await GET()
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual(expectedData)
    })

    it('should handle error case', async () => {
      // Setup error mock
      mockFunction.mockRejectedValue(new Error('Test error'))

      // Execute
      const response = await GET()
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })
  })
})
\`\`\`

### Best Practices

1. **Clear Test Names**: Use descriptive test names that explain the scenario
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Mock Cleanup**: Always clear mocks between tests
4. **Error Testing**: Test both success and failure paths
5. **Realistic Data**: Use realistic mock data
6. **Async Handling**: Properly handle async operations

## Debugging Tests

### View Test Output
\`\`\`bash
npm test -- --verbose
\`\`\`

### Debug Specific Test
\`\`\`bash
npm test -- --testNamePattern="specific test name" --verbose
\`\`\`

### Check Coverage
\`\`\`bash
npm run test:coverage
open coverage/lcov-report/index.html
\`\`\`

## Continuous Integration

These tests are designed to run in CI environments and provide:
- Fast execution
- Reliable mocking
- Clear error messages
- Comprehensive coverage reporting

The test suite ensures SolarTunes API reliability across different deployment environments.

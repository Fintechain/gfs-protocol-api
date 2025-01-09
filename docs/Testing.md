# TSEd Testing Infrastructure and Strategy Guide

## Overview
This guide outlines the testing infrastructure and best practices for TSEd applications using Vitest for unit tests and SuperTest with TestContainers for integration tests.

## Test Types

### 1. Unit Tests
Unit tests focus on testing individual components in isolation using Vitest.

#### Setup Structure
```typescript
// src/features/utils/services/__tests__/[ServiceName].spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { ServiceName } from "../ServiceName";

describe("ServiceName", () => {
    let service: ServiceName;
    
    beforeEach(async () => {
        await PlatformTest.create();
        service = new ServiceName();
    });

    afterEach(async () => {
        await PlatformTest.reset();
    });

    // Test cases
});
```

#### Key Features
1. Mock Management
   ```typescript
   // Create mocks
   const mockDependency = {
       method: vi.fn().mockResolvedValue(expectedResult)
   };

   // Reset mocks
   vi.clearAllMocks();
   ```

2. Lifecycle Methods
   - Use `beforeEach` for test setup
   - Use `afterEach` for cleanup
   - Use `beforeAll` for one-time setup
   - Use `afterAll` for one-time cleanup

3. Assertion Patterns
   ```typescript
   expect(result).toBe(expected);
   expect(mockMethod).toHaveBeenCalledWith(args);
   await expect(asyncOperation).rejects.toThrow(error);
   ```

### 2. Integration Tests
Integration tests verify component interactions using real dependencies through TestContainers.

#### Setup Structure
```typescript
// src/features/utils/services/__tests__/[ServiceName].integration.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { StartedTestContainer, GenericContainer } from "testcontainers";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

describe("ServiceName Integration", () => {
    let container: StartedTestContainer;
    let service: ServiceName;
    
    beforeAll(async () => {
        // Start container
        container = await new GenericContainer("image:tag")
            .withExposedPorts(port)
            .start();
            
        // Setup service with container connection
        await PlatformTest.create();
        service = new ServiceName({
            host: container.getHost(),
            port: container.getMappedPort(port)
        });
    });

    afterAll(async () => {
        await container?.stop();
        await PlatformTest.reset();
    });
});
```

#### Key Features
1. Container Management
   ```typescript
   // Redis container example
   const redisContainer = await new GenericContainer("redis:7-alpine")
       .withExposedPorts(6379)
       .withStartupTimeout(120000)
       .start();
   ```

2. Environment Management
   ```typescript
   // Store original env
   const originalEnv = { ...process.env };

   // Set test env
   process.env.SERVICE_HOST = container.getHost();
   process.env.SERVICE_PORT = container.getMappedPort(port).toString();

   // Restore env in afterAll
   process.env = originalEnv;
   ```

3. Real Service Interaction
   ```typescript
   // Example of real service test
   const result = await service.operation();
   expect(result).toMatchExpectedBehavior();
   ```

### 3. API Integration Tests
API tests verify HTTP endpoints using SuperTest.

#### Setup Structure
```typescript
// src/features/controllers/__tests__/[Controller].integration.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import SuperTest from "supertest";
import { beforeAll, afterAll, describe, it } from "vitest";
import { Server } from "../../Server";

describe("Controller", () => {
    beforeAll(
        PlatformTest.bootstrap(Server, {
            mount: {
                "/": [Controller]
            }
        })
    );
    
    afterAll(PlatformTest.reset);

    it("should handle endpoint", async () => {
        const request = SuperTest(PlatformTest.callback());
        await request
            .method("/path")
            .send(payload)
            .expect(expectedStatus);
    });
});
```

## Best Practices

### 1. Test Organization
- Place tests in `__tests__` directory adjacent to the tested component
- Use `.spec.ts` suffix for unit tests
- Use `.integration.spec.ts` suffix for integration tests
- Group related tests using describe blocks
- Use clear, descriptive test names

### 2. Mocking
- Mock external dependencies in unit tests
- Use `vi.mock()` for module mocking
- Use `vi.fn()` for function mocking
- Reset mocks between tests
- Avoid mocking in integration tests

### 3. Test Isolation
- Reset state between tests
- Use fresh containers for each integration test suite
- Restore environment variables after tests
- Clear all mocks before each test

### 4. Error Handling
- Test both success and error scenarios
- Verify error messages and types
- Test edge cases and boundary conditions
- Ensure proper cleanup in case of test failures

### 5. Performance
- Set appropriate timeouts for container startup
- Use beforeAll/afterAll for expensive setup/teardown
- Parallel test execution where possible
- Clean up resources promptly

## Test Configuration

### Vitest Config
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/*.integration.spec.ts']
    }
  }
});
```

### Package Scripts
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run *.integration.spec.ts"
  }
}
```

## Common Test Patterns

### 1. Service Testing
```typescript
describe("Service", () => {
    describe("Operation", () => {
        describe("Success cases", () => {
            it("should handle normal case", async () => {
                // Test implementation
            });
        });

        describe("Error cases", () => {
            it("should handle error case", async () => {
                // Test implementation
            });
        });
    });
});
```

### 2. Container Testing
```typescript
describe("Container Tests", () => {
    describe("Service Operations", () => {
        it("should interact with container", async () => {
            // Container interaction test
        });
    });
});
```

### 3. API Testing
```typescript
describe("API", () => {
    describe("Endpoint", () => {
        it("should handle valid request", async () => {
            // API test implementation
        });
    });
});
```

## Troubleshooting
1. Container Startup Issues
   - Increase startup timeout
   - Check container logs
   - Verify port mappings

2. Test Failures
   - Check test isolation
   - Verify mock reset
   - Ensure proper cleanup

3. Performance Issues
   - Review container usage
   - Check test parallelization
   - Optimize setup/teardown
# TSEd Testing Infrastructure and Strategy Prompt

## Input Parameters
Please provide the following information to generate the testing infrastructure:

1. Module Name: [Name of the feature module]
2. Component Types: [List of components to be tested (controllers, services, etc.)]
3. External Dependencies: [List of external services requiring mocking/containers]
4. Performance Requirements: [Performance testing requirements]
5. Security Requirements: [Security testing requirements]

## Test Infrastructure Generation Requirements

### 1. Test Environment Setup

#### Base Test Configuration
```typescript
// src/test/TestConfig.ts
export class TestConfig {
  static readonly DATABASE_OPTIONS = {
    type: 'postgres',
    synchronize: true,
    dropSchema: true,
    logging: false,
    entities: ['src/**/*.entity.ts']
  };

  static readonly REDIS_OPTIONS = {
    host: 'localhost',
    port: 6379
  };

  // Add other common test configurations
}

// src/test/TestContainer.ts
export class TestContainer {
  private static postgres: StartedPostgresToContainer;
  private static redis: StartedRedisContainer;

  static async start(): Promise<void> {
    // Start containers in parallel
    [this.postgres, this.redis] = await Promise.all([
      new PostgreSQLContainer()
        .withDatabase('test_db')
        .withUsername('test_user')
        .withPassword('test_pass')
        .start(),
      
      new RedisContainer().start()
    ]);

    // Update configuration with container details
    Object.assign(TestConfig.DATABASE_OPTIONS, {
      host: this.postgres.getHost(),
      port: this.postgres.getPort(),
      username: this.postgres.getUsername(),
      password: this.postgres.getPassword(),
      database: this.postgres.getDatabase()
    });

    Object.assign(TestConfig.REDIS_OPTIONS, {
      host: this.redis.getHost(),
      port: this.redis.getPort()
    });
  }

  static async stop(): Promise<void> {
    await Promise.all([
      this.postgres?.stop(),
      this.redis?.stop()
    ]);
  }
}
```

### 2. Test Factories

#### Entity Factories
```typescript
// src/test/factories/MessageFactory.ts
export class MessageFactory {
  static create(partial: Partial<Message> = {}): Message {
    return {
      id: faker.string.uuid(),
      messageType: 'pacs.008',
      payload: this.generateValidXML(),
      status: MessageStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...partial
    };
  }

  static createMany(count: number, partial: Partial<Message> = {}): Message[] {
    return Array.from({ length: count }, () => this.create(partial));
  }

  private static generateValidXML(): string {
    // Generate valid ISO20022 XML for testing
  }
}
```

#### Mock Factories
```typescript
// src/test/factories/MockFactory.ts
export class MockFactory {
  static createMockRepository<T>(): MockType<Repository<T>> {
    return {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn()
    };
  }

  static createMockService<T extends object>(
    methods: Array<keyof T>
  ): MockType<T> {
    const mock: any = {};
    methods.forEach(method => {
      mock[method] = jest.fn();
    });
    return mock;
  }
}
```

### 3. Test Utilities

#### Custom Matchers
```typescript
// src/test/matchers/CustomMatchers.ts
expect.extend({
  toBeValidMessage(received: Message) {
    const isValid = // Validation logic
    return {
      message: () => `expected ${received} to be a valid message`,
      pass: isValid
    };
  },

  toHaveErrorType(received: Error, expectedType: string) {
    const hasType = received.name === expectedType;
    return {
      message: () => `expected error to be of type ${expectedType}`,
      pass: hasType
    };
  }
});
```

#### Test Helpers
```typescript
// src/test/helpers/TestHelpers.ts
export class TestHelpers {
  static async createTestTransaction(): Promise<EntityManager> {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    return queryRunner.manager;
  }

  static async clearDatabase(): Promise<void> {
    const connection = getConnection();
    const entities = connection.entityMetadatas;
    
    for (const entity of entities) {
      const repository = connection.getRepository(entity.name);
      await repository.clear();
    }
  }
}
```

### 4. Integration Test Base Classes

#### Base Integration Test
```typescript
// src/test/integration/BaseIntegrationTest.ts
export class BaseIntegrationTest {
  protected app: PlatformTest;

  async beforeAll(): Promise<void> {
    await TestContainer.start();
    
    this.app = await PlatformTest.create({
      imports: [
        TypeORMModule.forRoot(TestConfig.DATABASE_OPTIONS),
        RedisModule.forRoot(TestConfig.REDIS_OPTIONS),
        // Add other required modules
      ]
    });
  }

  async afterAll(): Promise<void> {
    await TestContainer.stop();
    await PlatformTest.reset();
  }

  async beforeEach(): Promise<void> {
    await TestHelpers.clearDatabase();
  }
}
```

### 5. Test Types

#### Contract Tests
```typescript
// src/test/contract/MessageAPIContract.test.ts
describe('Message API Contract', () => {
  const contract = new OpenAPIContract('openapi.yaml');

  it('should match OpenAPI specification', async () => {
    const response = await request(app)
      .post('/api/messages')
      .send(MessageFactory.create());

    expect(response).toMatchAPISchema(contract, '/messages', 'post');
  });
});
```

#### Performance Tests
```typescript
// src/test/performance/MessageProcessing.test.ts
describe('Message Processing Performance', () => {
  it('should process messages within SLA', async () => {
    const messages = MessageFactory.createMany(100);
    const startTime = Date.now();

    await Promise.all(
      messages.map(msg => 
        request(app)
          .post('/api/messages')
          .send(msg)
      )
    );

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // 5 second SLA
  });
});
```

#### Security Tests
```typescript
// src/test/security/MessageAPI.security.test.ts
describe('Message API Security', () => {
  it('should prevent SQL injection', async () => {
    const maliciousPayload = MessageFactory.create({
      id: "'; DROP TABLE messages; --"
    });

    const response = await request(app)
      .post('/api/messages')
      .send(maliciousPayload);

    expect(response.status).toBe(400);
    // Verify database integrity
  });
});
```

### 6. CI/CD Integration

#### Jest Configuration
```typescript
// jest.config.ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/test/**/*.ts'
  ]
};
```

#### Test Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "test:perf": "jest --config ./test/jest-perf.json"
  }
}
```

## Response Format

The response should include:
1. Complete test infrastructure setup
2. Test factories and utilities
3. Base test classes
4. Example tests for each test type
5. CI/CD configuration
6. Test coverage configuration

## Additional Considerations
- Test data cleanup
- Test isolation
- Transaction handling in tests
- Parallel test execution
- Test debugging support
- Test documentation
- Test maintenance

## Testing Best Practices
1. Use test containers for external dependencies
2. Implement proper test isolation
3. Follow AAA pattern (Arrange, Act, Assert)
4. Use factories for test data
5. Implement proper cleanup
6. Mock external dependencies
7. Test error scenarios
8. Measure and maintain coverage
9. Document test scenarios
10. Maintain test performance
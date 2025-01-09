# TSEd Service Generation Prompt

## Input Parameters
Please provide the following information to generate the services:

1. Module Name: [Name of the feature module]
2. Service Names: [List of services to be generated]
3. Related Models: [List of models these services will work with]
4. External Dependencies: [External services or integrations required]
5. Event Requirements: [Event publishing/subscription needs]
6. Transaction Requirements: [Transaction boundaries and isolation levels]

## Service Generation Requirements

### 1. Base Service Configuration
- TSEd service decorators
- Dependency injection setup
- Repository injection
- Logger integration
- Configuration injection
- Event dispatcher integration

### 2. Business Logic Organization

#### Core Business Logic
- Domain-specific operations
- Business rule validation
- Complex calculations
- State management
- Workflow orchestration

#### Data Access Layer
- Repository methods
- Custom queries
- Bulk operations
- Caching strategies
- Data transformation

#### External Integration Layer
- API clients
- External service calls
- Retry strategies
- Circuit breakers
- Timeout handling

### 3. Transaction Management

#### Transaction Patterns
```typescript
/**
 * Example transaction pattern with repository
 */
@Service()
export class MessageService {
  constructor(
    @Inject(MessageRepository) private repository: MessageRepository,
    @Inject(EventDispatcher) private eventDispatcher: EventDispatcher
  ) {}

  @Transactional()
  async createMessage(data: CreateMessageDto): Promise<Message> {
    try {
      // Start transaction
      const message = await this.repository.createMessage(data);
      
      // Publish event within transaction
      await this.eventDispatcher.dispatch(new MessageCreatedEvent(message));
      
      return message;
    } catch (error) {
      // Transaction will automatically rollback
      this.handleError(error);
    }
  }
}
```

#### Transaction Boundaries
- Method-level transactions
- Nested transactions
- Isolation levels
- Deadlock handling
- Transaction timeout handling

### 4. Event Handling

#### Event Publishing
```typescript
@Service()
export class MessageService {
  @Transactional()
  async processMessage(message: Message): Promise<void> {
    try {
      // Business logic
      const result = await this.processBusinessLogic(message);
      
      // Publish different events based on result
      if (result.isValid) {
        await this.eventDispatcher.dispatch(new MessageValidatedEvent(message));
      } else {
        await this.eventDispatcher.dispatch(new MessageValidationFailedEvent(message, result.errors));
      }
    } catch (error) {
      await this.eventDispatcher.dispatch(new MessageProcessingFailedEvent(message, error));
      throw error;
    }
  }
}
```

#### Event Subscription
```typescript
@Service()
export class MessageService {
  @OnEvent(MessageCreatedEvent)
  async handleMessageCreated(event: MessageCreatedEvent): Promise<void> {
    try {
      // Handle event
      await this.processNewMessage(event.message);
    } catch (error) {
      // Error handling for event processing
      this.handleEventError(error, event);
    }
  }
}
```

### 5. Error Handling

#### Error Types
- Domain-specific errors
- Infrastructure errors
- Integration errors
- Validation errors
- Timeout errors

#### Error Handling Patterns
```typescript
@Service()
export class MessageService {
  private async handleError(error: Error): Promise<never> {
    // Log error details
    this.logger.error('Error in MessageService', {
      error,
      context: 'MessageService',
      stack: error.stack
    });

    // Transform to appropriate error type
    if (error instanceof TypeORMError) {
      throw new DatabaseError('Database operation failed', { cause: error });
    }
    if (error instanceof ValidationError) {
      throw new InvalidMessageError('Message validation failed', { cause: error });
    }
    if (error instanceof AxiosError) {
      throw new IntegrationError('External service call failed', { cause: error });
    }

    // Default error
    throw new InternalServerError('Unexpected error occurred', { cause: error });
  }
}
```

### 6. Testing Strategy

#### Unit Tests
```typescript
describe('MessageService', () => {
  let service: MessageService;
  let repository: MockType<MessageRepository>;
  let eventDispatcher: MockType<EventDispatcher>;

  beforeEach(() => {
    // Setup mocks
    repository = createMock<MessageRepository>();
    eventDispatcher = createMock<EventDispatcher>();
    
    service = new MessageService(repository, eventDispatcher);
  });

  describe('createMessage', () => {
    it('should create message and dispatch event', async () => {
      // Arrange
      const messageData = createMessageData();
      const expectedMessage = createMessage(messageData);
      repository.create.mockResolvedValue(expectedMessage);

      // Act
      const result = await service.createMessage(messageData);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(messageData);
      expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
        expect.any(MessageCreatedEvent)
      );
      expect(result).toEqual(expectedMessage);
    });

    it('should handle validation errors', async () => {
      // Test validation error scenarios
    });

    it('should handle database errors', async () => {
      // Test database error scenarios
    });
  });
});
```

#### Integration Tests (Testcontainers)
```typescript
describe('MessageService Integration', () => {
  let postgres: StartedPostgresToContainer;
  let redis: StartedRedisContainer;
  let service: MessageService;
  
  beforeAll(async () => {
    // Start containers
    postgres = await new PostgreSQLContainer().start();
    redis = await new RedisContainer().start();

    // Configure service with real dependencies
    const module = await PlatformTest.createTestingModule({
      imports: [
        TypeORMModule.forRoot({
          type: 'postgres',
          host: postgres.getHost(),
          port: postgres.getPort(),
          username: postgres.getUsername(),
          password: postgres.getPassword(),
          database: postgres.getDatabase(),
          entities: [Message],
          synchronize: true
        }),
        RedisModule.forRoot({
          host: redis.getHost(),
          port: redis.getPort()
        }),
        EventEmitterModule.forRoot(),
        MessageModule
      ]
    }).compile();

    service = module.get<MessageService>(MessageService);
  });

  afterAll(async () => {
    await postgres.stop();
    await redis.stop();
  });

  it('should process message end-to-end', async () => {
    // Arrange
    const messageData = createMessageData();

    // Act
    const result = await service.processMessage(messageData);

    // Assert
    // Verify database state
    const savedMessage = await getRepository(Message).findOne({
      where: { id: result.id }
    });
    expect(savedMessage).toBeDefined();

    // Verify event was published
    // Verify cache was updated
    // Verify external notifications were sent
  });
});
```

### 7. Documentation Requirements
Include:
- JSDoc comments for the class and methods
- Method parameter documentation
- Return type documentation
- Error documentation
- Transaction boundary documentation
- Event documentation
- Usage examples

### 8. Performance Considerations
Document:
- Caching strategies
- Batch processing patterns
- Query optimization
- Connection pooling
- Resource cleanup
- Memory management

## Response Format

The response should include:
1. Complete TypeScript code for each service
2. Event definitions and handlers
3. Error types and handling
4. Unit tests
5. Integration tests
6. Implementation notes
7. Performance considerations

## Additional Considerations
- Consider service boundaries
- Plan for scaling
- Implement proper logging
- Consider monitoring and metrics
- Plan for feature flags
- Implement proper cleanup
- Consider memory management
- Plan for failover scenarios

## Testing Best Practices
1. Test business logic thoroughly
2. Test transaction boundaries
3. Test event publishing/handling
4. Test error handling paths
5. Test external integrations
6. Test performance under load
7. Test cleanup and resource management
8. Test concurrent operations
9. Test timeout scenarios
10. Test retry mechanisms
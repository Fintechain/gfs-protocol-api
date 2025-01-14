# TSEd Controller Generation Prompt

## Input Parameters
Please provide the following information to generate the controllers:

1. Module Name: [Name of the feature module]
2. Controller Names: [List of controllers to be generated]
3. Related Models: [List of models these controllers will work with]
4. Required Services: [List of services these controllers will depend on]
5. Special Requirements: [Any specific requirements for these controllers]

## Controller Generation Requirements

### 1. Base Controller Configuration
- TSEd controller decorators and configuration
- Base path configuration
- Common middleware requirements
- Error handler integration
- Authentication/Authorization requirements
- Rate limiting configuration

### 2. Endpoint Definitions
For each endpoint, specify:
- HTTP method and path
- Request/Response DTOs
- Path parameters
- Query parameters
- Request body schema
- Response schema
- Status codes
- Authentication requirements
- Rate limiting rules

### 3. OpenAPI Documentation
Include:
- @Returns decorators with status codes
- @Summary and @Description
- @Tags for API grouping
- Parameter descriptions
- Example requests/responses
- Security requirements
- Deprecation notices if applicable

### 4. Validation
Define:
- DTO validation rules
- Custom validators
- Validation middleware
- Error response formats
- Validation groups if needed

### 5. Error Handling
Implement:
- Global error handler integration
- Custom error types
- Error response formats
- Logging requirements
- Recovery strategies

### 6. Testing Strategy

#### Unit Tests
- Controller method tests
- DTO validation tests
- Error handling tests
- Mock service interactions
- Authentication tests

```typescript
// Example unit test structure
describe('MessageController', () => {
  let controller: MessageController;
  let messageService: MessageService;

  beforeEach(() => {
    messageService = {
      createMessage: jest.fn(),
      // ... other mocked methods
    };

    controller = new MessageController(messageService);
  });

  describe('createMessage', () => {
    it('should create a new message', async () => {
      // Arrange
      const dto = new CreateMessageDto();
      const expectedResult = new Message();
      messageService.createMessage.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.createMessage(dto);

      // Assert
      expect(messageService.createMessage).toHaveBeenCalledWith(dto);
      expect(result).toBe(expectedResult);
    });

    it('should handle validation errors', async () => {
      // Test validation error scenarios
    });
  });
});
```

#### Integration Tests (Testcontainers)
- End-to-end API tests
- Database interaction tests
- External service integration tests
- Performance tests
- Container setup and teardown

```typescript
// Example integration test structure
describe('MessageController Integration', () => {
  let postgres: StartedPostgresToContainer;
  let app: PlatformTest;
  
  beforeAll(async () => {
    // Start PostgreSQL container
    postgres = await new PostgreSQLContainer()
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_pass')
      .start();

    // Configure test platform
    await PlatformTest.create({
      imports: [
        TypeORMModule.forRoot({
          type: 'postgres',
          host: postgres.getHost(),
          port: postgres.getPort(),
          username: postgres.getUsername(),
          password: postgres.getPassword(),
          database: postgres.getDatabase(),
          synchronize: true,
          entities: [/* entities */],
        }),
        MessagesModule
      ]
    });
  });

  afterAll(async () => {
    await postgres.stop();
    await PlatformTest.reset();
  });

  it('should create message through API', async () => {
    // Arrange
    const request = SuperTest(PlatformTest.callback());
    const messageData = { /* test data */ };

    // Act
    const response = await request
      .post('/api/messages')
      .send(messageData)
      .expect(201);

    // Assert
    expect(response.body).toMatchObject({
      // Expected response structure
    });

    // Verify database state
    const savedMessage = await getRepository(Message).findOne({
      where: { id: response.body.id }
    });
    expect(savedMessage).toBeDefined();
  });
});
```

## Example Output Format

```typescript
/**
 * Message Controller
 * 
 * Handles operations related to ISO20022 message processing
 */
@Controller('/messages')
@UseAuth(AuthMiddleware)
@UseCache(CacheMiddleware)
export class MessageController {
  constructor(
    @Inject() private messageService: MessageService,
    @Inject() private logger: LoggerService
  ) {}

  /**
   * Create a new message
   * 
   * @param {CreateMessageDto} dto - Message creation data
   * @returns {Promise<Message>} Created message
   */
  @Post('/')
  @Summary('Create a new message')
  @Description('Creates a new ISO20022 message with validation')
  @Returns(201, Message)
  @Returns(400, BadRequest)
  @Returns(401, Unauthorized)
  @Returns(500, InternalServerError)
  @UseValidation()
  async createMessage(
    @BodyParams() @Required() dto: CreateMessageDto
  ): Promise<Message> {
    try {
      this.logger.debug('Creating message', { dto });
      return await this.messageService.createMessage(dto);
    } catch (error) {
      this.logger.error('Error creating message', { error, dto });
      throw new BadRequest('Failed to create message');
    }
  }

  // Other endpoint implementations...
}
```

### 7. Documentation Requirements
Include:
- JSDoc comments for the class and methods
- Method parameter documentation
- Response type documentation
- Error documentation
- Usage examples
- Authentication requirements
- Rate limiting notes

### 8. Performance Considerations
Document:
- Caching strategy
- Rate limiting rules
- Pagination implementation
- Query optimization
- Response streaming if needed

## Response Format

The response should include:
1. Complete TypeScript code for each controller
2. DTOs and validation schemas
3. Unit tests
4. Integration tests
5. OpenAPI documentation
6. Implementation notes
7. Performance considerations

## Additional Considerations
- Ensure consistent error handling patterns
- Implement proper logging
- Consider API versioning
- Plan for backwards compatibility
- Document rate limiting and caching strategies
- Consider bulk operation endpoints
- Implement proper security headers
- Consider monitoring and metrics

## Testing Best Practices
1. Test edge cases and error conditions
2. Mock external dependencies
3. Use factory patterns for test data
4. Implement contract tests
5. Test validation rules thoroughly
6. Test error handling paths
7. Verify OpenAPI documentation accuracy
8. Test performance under load
9. Test security measures
10. Test rate limiting and caching
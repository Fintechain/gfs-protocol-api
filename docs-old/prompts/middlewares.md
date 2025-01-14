# TSEd Middleware Generation Prompt

## Input Parameters
Please provide the following information to generate the middleware:

1. Module Name: [Name of the feature module]
2. Middleware Names: [List of middleware to be generated]
3. Required Services: [Services the middleware will depend on]
4. Authentication Requirements: [Auth requirements if applicable]
5. Logging Requirements: [Specific logging needs]
6. Error Handling Requirements: [Error handling strategies]

## Middleware Generation Requirements

### 1. Base Middleware Configuration
- TSEd middleware decorators
- Execution order configuration
- Dependency injection setup
- Error handler integration
- Performance monitoring setup

### 2. Request/Response Handling

#### Request Processing
```typescript
/**
 * Example request processing middleware
 */
@Middleware()
export class RequestValidationMiddleware implements IMiddleware {
  constructor(
    @Inject() private validator: ValidationService,
    @Inject() private logger: LoggerService
  ) {}

  public async use(
    @Req() request: Req,
    @Res() response: Res,
    @Next() next: NextFn
  ): Promise<void> {
    try {
      // Extract relevant data
      const { body, params, query } = request;

      // Pre-processing logic
      this.logger.debug('Processing request', { body, params, query });

      // Validate request
      await this.validator.validateRequest(request);

      // Attach processed data to request
      request.validatedData = processedData;

      return next();
    } catch (error) {
      return this.handleError(error, request, response);
    }
  }
}
```

#### Response Processing
```typescript
@Middleware()
export class ResponseTransformMiddleware implements IMiddleware {
  public async use(
    @Req() request: Req,
    @Res() response: Res,
    @Next() next: NextFn
  ): Promise<void> {
    // Store original send
    const originalSend = response.send;

    // Override send method
    response.send = (body: any): Response => {
      // Transform response body
      const transformed = this.transformResponse(body);
      
      // Call original send with transformed body
      return originalSend.call(response, transformed);
    };

    return next();
  }
}
```

### 3. Authentication/Authorization

#### Authentication Middleware
```typescript
@Middleware()
export class AuthenticationMiddleware implements IMiddleware {
  constructor(
    @Inject() private authService: AuthService,
    @Inject() private logger: LoggerService
  ) {}

  public async use(
    @Req() request: Req,
    @Res() response: Res,
    @Next() next: NextFn
  ): Promise<void> {
    try {
      // Extract token
      const token = this.extractToken(request);
      
      if (!token) {
        throw new UnauthorizedError('No token provided');
      }

      // Verify token
      const user = await this.authService.verifyToken(token);
      
      // Attach user to request
      request.user = user;

      // Log successful authentication
      this.logger.debug('User authenticated', { userId: user.id });

      return next();
    } catch (error) {
      return this.handleAuthError(error, response);
    }
  }
}
```

### 4. Logging

#### Request Logging
```typescript
@Middleware()
export class RequestLoggingMiddleware implements IMiddleware {
  constructor(@Inject() private logger: LoggerService) {}

  public async use(
    @Req() request: Req,
    @Res() response: Res,
    @Next() next: NextFn
  ): Promise<void> {
    // Generate request ID
    const requestId = uuid();
    request.requestId = requestId;

    // Log request start
    const startTime = Date.now();
    this.logger.info('Request started', {
      requestId,
      method: request.method,
      url: request.url,
      headers: this.sanitizeHeaders(request.headers),
      query: request.query,
      body: this.sanitizeBody(request.body)
    });

    // Track response
    response.on('finish', () => {
      const duration = Date.now() - startTime;
      this.logger.info('Request completed', {
        requestId,
        duration,
        statusCode: response.statusCode
      });
    });

    return next();
  }
}
```

### 5. Error Handling

#### Global Error Handler
```typescript
@Middleware()
export class GlobalErrorHandler implements ErrorMiddleware {
  constructor(@Inject() private logger: LoggerService) {}

  public async use(
    error: Error,
    request: Req,
    response: Res,
    next: NextFn
  ): Promise<void> {
    // Log error
    this.logger.error('Request error', {
      requestId: request.requestId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });

    // Transform error to appropriate response
    const errorResponse = this.transformError(error);

    // Send error response
    response
      .status(errorResponse.status)
      .json(errorResponse);
  }

  private transformError(error: Error): ErrorResponse {
    if (error instanceof ValidationError) {
      return {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.details
      };
    }
    
    if (error instanceof UnauthorizedError) {
      return {
        status: 401,
        code: 'UNAUTHORIZED',
        message: error.message
      };
    }

    // Default error
    return {
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    };
  }
}
```

### 6. Testing Strategy

#### Unit Tests
```typescript
describe('AuthenticationMiddleware', () => {
  let middleware: AuthenticationMiddleware;
  let authService: MockType<AuthService>;
  let logger: MockType<LoggerService>;

  beforeEach(() => {
    // Setup mocks
    authService = createMock<AuthService>();
    logger = createMock<LoggerService>();
    
    middleware = new AuthenticationMiddleware(authService, logger);
  });

  it('should authenticate valid token', async () => {
    // Arrange
    const request = createMockRequest({
      headers: { authorization: 'Bearer valid-token' }
    });
    const response = createMockResponse();
    const next = jest.fn();
    const mockUser = { id: '123', name: 'Test User' };
    
    authService.verifyToken.mockResolvedValue(mockUser);

    // Act
    await middleware.use(request, response, next);

    // Assert
    expect(authService.verifyToken).toHaveBeenCalledWith('valid-token');
    expect(request.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it('should handle missing token', async () => {
    // Test missing token scenario
  });

  it('should handle invalid token', async () => {
    // Test invalid token scenario
  });
});
```

#### Integration Tests
```typescript
describe('Middleware Integration', () => {
  let app: PlatformTest;
  
  beforeAll(async () => {
    // Setup test platform with middleware
    await PlatformTest.create({
      imports: [
        // Required modules
      ],
      middlewares: [
        RequestLoggingMiddleware,
        AuthenticationMiddleware,
        GlobalErrorHandler
      ]
    });
  });

  afterAll(() => PlatformTest.reset());

  it('should process request through middleware chain', async () => {
    // Arrange
    const request = SuperTest(PlatformTest.callback());

    // Act
    const response = await request
      .get('/api/test')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    // Assert
    // Verify logging
    // Verify authentication
    // Verify response transformation
  });
});
```

### 7. Performance Monitoring
- Request duration tracking
- Memory usage monitoring
- Error rate tracking
- Response time histograms
- Middleware execution time tracking

### 8. Security Considerations
- Input sanitization
- Output encoding
- Header security
- Token validation
- Rate limiting
- DOS protection

## Response Format

The response should include:
1. Complete TypeScript code for each middleware
2. Error handling implementation
3. Logging implementation
4. Unit tests
5. Integration tests
6. Security considerations
7. Performance monitoring setup

## Additional Considerations
- Middleware execution order
- Error propagation
- Resource cleanup
- Memory leaks prevention
- Request context management
- Response streaming
- Timeout handling
- Circuit breaking

## Testing Best Practices
1. Test middleware chain execution
2. Test error propagation
3. Test request/response manipulation
4. Test authentication flows
5. Test logging accuracy
6. Test performance impact
7. Test memory usage
8. Test concurrent requests
9. Test timeout scenarios
10. Test security measures
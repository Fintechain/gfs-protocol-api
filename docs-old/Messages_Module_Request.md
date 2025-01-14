## Model Generation Request

Module Name: messages
Model Names: 
- Message
- MessageDraft
- MessageValidation
- MessageTransformation

Existing Models:
- Institution (from institutions module)
- User (from auth module)

Special Requirements:
- Messages must support ISO20022 XML payload storage
- Need audit logging for all changes
- Must track blockchain transaction status
- Support for multiple message versions

## Controller Generation Request

Module Name: messages
Controller Names:
- MessageController (main CRUD operations)
- MessageValidationController (validation operations)
- MessageTransformationController (transformation operations)
- MessageSearchController (search and filtering)

Related Models:
- Message
- MessageDraft
- MessageValidation
- MessageTransformation

Required Services:
- MessageService
- ValidationService
- TransformationService
- SearchService

Special Requirements:
- Must handle large XML payloads
- Need request/response logging for audit
- Require rate limiting for validation endpoints
- Support bulk operations for messages

## Service Generation Request

Module Name: messages
Service Names:
- MessageService (core message operations)
- ValidationService (ISO20022 validation)
- TransformationService (message transformation)
- SearchService (message search and filtering)

Related Models:
- Message
- MessageDraft
- MessageValidation
- MessageTransformation

External Dependencies:
- Blockchain Service (for message submission)
- ISO20022 Validation Service
- Message Transform Service
- Event Dispatcher

Event Requirements:
- MessageCreatedEvent
- MessageValidatedEvent
- MessageTransformedEvent
- MessageSubmittedEvent
- MessageFailedEvent

Transaction Requirements:
- Message creation must be atomic
- Validation results must be saved within message transaction
- Transformations must be tracked
- All operations must be audited
## Middleware Generation Request

Module Name: messages
Middleware Names:
- MessageValidationMiddleware (validates incoming message requests)
- MessageAuthMiddleware (checks institution permissions)
- MessageLoggingMiddleware (logs message operations)
- MessageErrorHandler (handles message-specific errors)

Required Services:
- AuthService
- ValidationService
- LoggerService
- MessageService

Authentication Requirements:
- Validate institution API keys
- Check institution permissions for message types
- Verify user roles within institution

Logging Requirements:
- Log full message payloads
- Track message processing time
- Log validation errors
- Audit logging for all operations

Error Handling Requirements:
- Handle ISO20022 validation errors
- Handle authentication failures
- Handle rate limiting errors
- Handle integration errors

## Testing Infrastructure Request

Module Name: messages
Component Types:
- Controllers (MessageController, ValidationController)
- Services (MessageService, ValidationService)
- Middleware (MessageValidationMiddleware)
- Models (Message, MessageValidation)

External Dependencies:
- PostgreSQL database
- Redis cache
- Blockchain node
- ISO20022 validation service

Performance Requirements:
- Message processing under 1s
- Batch processing up to 1000 messages
- Maximum 2s validation time
- 99.9% uptime

Security Requirements:
- Input validation
- SQL injection prevention
- XML attack prevention
- Rate limiting tests
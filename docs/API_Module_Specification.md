# GFS Protocol API Module Specification

## 1. Messages Module (`/src/messages`)
Core functionality for ISO20022 message handling.

### Models
- `Message.ts` - Core message entity
  - Tracks message lifecycle
  - Stores ISO20022 XML payload
  - Links to blockchain transactions
- `MessageDraft.ts` - Draft message storage
- `MessageValidation.ts` - Validation results
- `MessageTransformation.ts` - Message transformation records

### Services
- `MessageService.ts` - Core message operations
- `ValidationService.ts` - ISO20022 schema validation
- `TransformationService.ts` - Message format transformation
- `MessageQueueService.ts` - Async message processing
- `MessageSearchService.ts` - Advanced message querying

### Controllers
- `MessageController.ts` - Message CRUD operations
- `ValidationController.ts` - Message validation endpoints
- `TransformationController.ts` - Format transformation endpoints
- `SearchController.ts` - Message search and filtering

### Utils
- `XMLValidator.ts` - ISO20022 XML validation
- `MessageMapper.ts` - Message format conversion
- `SchemaLoader.ts` - ISO20022 schema management

## 2. Blockchain Module (`/src/blockchain`)
Handles blockchain integration and smart contract interaction.

### Models
- `Transaction.ts` - Blockchain transaction records
- `Chain.ts` - Supported blockchain networks
- `Contract.ts` - Smart contract configurations

### Services
- `BlockchainService.ts` - Core blockchain operations
- `WormholeService.ts` - Cross-chain communication
- `ContractService.ts` - Smart contract interaction
- `TransactionMonitorService.ts` - Transaction tracking

### Controllers
- `BlockchainController.ts` - Blockchain operations
- `TransactionController.ts` - Transaction management
- `ChainController.ts` - Chain management

### Utils
- `Web3Provider.ts` - Blockchain provider management
- `TransactionBuilder.ts` - Transaction construction
- `ContractABI.ts` - Smart contract interface definitions

## 3. Institutions Module (`/src/institutions`)
Management of financial institutions and their configurations.

### Models
- `Institution.ts` - Financial institution entity
- `InstitutionConfig.ts` - Institution configurations
- `InstitutionHierarchy.ts` - Parent-child relationships
- `InstitutionPermission.ts` - Permission settings

### Services
- `InstitutionService.ts` - Institution management
- `HierarchyService.ts` - Institution hierarchy
- `PermissionService.ts` - Permission management
- `InstitutionConfigService.ts` - Configuration management

### Controllers
- `InstitutionController.ts` - Institution CRUD
- `HierarchyController.ts` - Hierarchy management
- `PermissionController.ts` - Permission management
- `ConfigController.ts` - Configuration management

### Utils
- `InstitutionValidator.ts` - Institution validation
- `HierarchyResolver.ts` - Hierarchy relationship resolution

## 4. Events Module (`/src/events`)
Event handling and notifications system.

### Models
- `Event.ts` - System event records
- `EventSubscription.ts` - Event subscriptions
- `Notification.ts` - Notification records
- `WebhookConfig.ts` - Webhook configurations

### Services
- `EventService.ts` - Event management
- `NotificationService.ts` - Notification dispatch
- `WebhookService.ts` - Webhook handling
- `EventQueueService.ts` - Event processing queue

### Controllers
- `EventController.ts` - Event management
- `SubscriptionController.ts` - Subscription management
- `WebhookController.ts` - Webhook configuration

### Utils
- `EventEmitter.ts` - Custom event emission
- `WebhookValidator.ts` - Webhook validation

## 5. Auth Module (`/src/auth`)
Authentication and authorization management.

### Models
- `User.ts` - User accounts
- `Role.ts` - User roles
- `Permission.ts` - Permission definitions
- `Session.ts` - User sessions

### Services
- `AuthService.ts` - Authentication logic
- `UserService.ts` - User management
- `RoleService.ts` - Role management
- `SessionService.ts` - Session management

### Controllers
- `AuthController.ts` - Authentication endpoints
- `UserController.ts` - User management
- `RoleController.ts` - Role management

### Middlewares
- `AuthMiddleware.ts` - Authentication checks
- `RoleMiddleware.ts` - Role-based access control
- `SessionMiddleware.ts` - Session validation

## 6. Compliance Module (`/src/compliance`)
Regulatory compliance and reporting.

### Models
- `AuditLog.ts` - Audit trail records
- `ComplianceReport.ts` - Regulatory reports
- `ComplianceRule.ts` - Compliance rules

### Services
- `AuditService.ts` - Audit logging
- `ReportingService.ts` - Report generation
- `ComplianceService.ts` - Compliance checking

### Controllers
- `AuditController.ts` - Audit trail management
- `ReportingController.ts` - Report generation
- `ComplianceController.ts` - Compliance management

### Utils
- `ReportGenerator.ts` - Report formatting
- `ComplianceValidator.ts` - Rule validation

## 7. Utils Module (`/src/utils`)
Shared utilities and common functionality.

### Services
- `LoggerService.ts` - Application logging
- `CacheService.ts` - Data caching
- `ConfigService.ts` - Configuration management
- `MetricsService.ts` - Performance metrics

### Middlewares
- `LoggerMiddleware.ts` - Request logging
- `ErrorMiddleware.ts` - Error handling
- `MetricsMiddleware.ts` - Metrics collection

### Utils
- `Validator.ts` - Common validation
- `Formatter.ts` - Data formatting
- `TypeConverter.ts` - Type conversion
- `SecurityUtils.ts` - Security helpers

## Common Interfaces (`/src/interfaces`)
Shared TypeScript interfaces and types.

- `IMessage.ts` - Message interfaces
- `IInstitution.ts` - Institution interfaces
- `IBlockchain.ts` - Blockchain interfaces
- `IEvent.ts` - Event interfaces
- `IUser.ts` - User interfaces
- `IConfig.ts` - Configuration interfaces

## Database Migrations (`/src/migrations`)
TypeORM database migrations.

- Initial schema creation
- Feature-specific migrations
- Index creation
- Data seeding

## Configuration (`/src/config`)
Application configuration files.

- `database.config.ts` - Database configuration
- `blockchain.config.ts` - Blockchain configuration
- `auth.config.ts` - Authentication configuration
- `app.config.ts` - General application configuration
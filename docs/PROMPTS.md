# ISO 20022 Message Processing System - Generation Prompts

## 1. Controller Layer Prompts

### 1.1 Message Controller Generation
```prompt
Generate a TypeScript controller for handling ISO 20022 messages with the following requirements:
- Create REST endpoints for message processing
- Handle POST requests to /api/messages endpoint
- Extract and validate the ISO 20022 XML message from the request body
- Support basic authentication and authorization checks
- Integrate with MessageProcessingService for orchestrating the processing flow
- Include comprehensive error handling
- Follow RESTful best practices
- Include unit tests using Jest
```

## 2. Service Layer Prompts

### 2.1 Message Processing Service
```prompt
Create a TypeScript implementation of the MessageProcessingService that:
- Implements the MessageProcessingService interface
- Orchestrates the end-to-end message processing flow
- Coordinates between ValidationService, TransformationService, and ProcessingService
- Manages the sequential flow of message processing
- Implements proper error handling and propagation
- Provides comprehensive logging and monitoring
- Includes retry logic for failed operations
- Contains unit tests for the orchestration flow
```

### 2.2 Validation Service
```prompt
Generate a TypeScript implementation of the ValidationService that:
- Implements the ValidationService interface
- Interacts with ValidationPipelineFactory to get appropriate pipeline instances
- Manages validation pipeline execution
- Handles validation result aggregation
- Provides detailed validation error reporting
- Implements proper error handling
- Contains unit tests for various validation scenarios
```

### 2.3 Transformation Service
```prompt
Create a TypeScript implementation of the TransformationService that:
- Implements the TransformationService interface
- Interacts with TransformationPipelineFactory to get appropriate pipeline instances
- Manages transformation pipeline execution
- Handles partial message transformations
- Provides clear logging and debugging capabilities
- Implements proper error handling
- Contains unit tests for transformation scenarios
```

### 2.4 Processing Service
```prompt
Generate a TypeScript implementation of the ProcessingService that:
- Implements the ProcessingService interface
- Interacts with ProcessingPipelineFactory to get appropriate pipeline instances
- Manages processing pipeline execution
- Coordinates with BlockchainAdapter for transaction submission
- Implements proper error handling
- Provides comprehensive logging
- Contains unit tests for processing scenarios
```

## 3. Pipeline Layer Prompts

### 3.1 Base Pipeline Implementation
```prompt
Create a TypeScript implementation of the base Pipeline that:
- Implements the Pipeline interface
- Supports dynamic stage registration and ordering
- Manages stage execution sequence
- Provides pipeline metrics collection
- Implements proper error handling
- Includes stage dependency management
- Contains unit tests for pipeline operations
```

### 3.2 Validation Pipeline
```prompt
Generate a TypeScript implementation of the ValidationPipeline that:
- Extends the base Pipeline implementation
- Implements the ValidationPipeline interface
- Manages validation stage execution
- Aggregates validation results
- Handles validation rule processing
- Includes performance optimizations
- Contains unit tests for validation flows
```

### 3.3 Transformation Pipeline
```prompt
Create a TypeScript implementation of the TransformationPipeline that:
- Extends the base Pipeline implementation
- Implements the TransformationPipeline interface
- Manages transformation stage execution
- Handles incremental message transformation
- Provides transformation progress tracking
- Includes error recovery mechanisms
- Contains unit tests for transformation flows
```

### 3.4 Processing Pipeline
```prompt
Generate a TypeScript implementation of the ProcessingPipeline that:
- Extends the base Pipeline implementation
- Implements the ProcessingPipeline interface
- Manages processing stage execution
- Handles blockchain interaction preparation
- Provides processing progress tracking
- Implements retry mechanisms
- Contains unit tests for processing flows
```

## 4. Stage Layer Prompts

### 4.1 Base Stage Implementation
```prompt
Create a TypeScript implementation of the base PipelineStage that:
- Implements the PipelineStage interface
- Supports stage configuration
- Includes dependency management
- Provides metrics collection
- Implements error handling
- Contains unit tests for stage operations
```

### 4.2 Validation Stages
```prompt
Generate TypeScript implementations for common validation stages:
- Extends the base PipelineStage implementation
- XML Schema validation stage
- Business rule validation stage
- Field format validation stage
- Cross-field validation stage
- Implements the ValidationStage interface
- Supports validation rule management
- Include unit tests for each stage
```

### 4.3 Transformation Stages
```prompt
Create TypeScript implementations for common transformation stages:
- Extends the base PipelineStage implementation
- XML parsing stage
- Field mapping stage
- Data enrichment stage
- Format conversion stage
- Implements the TransformationStage interface
- Handles partial message transformation
- Include unit tests for each stage
```

### 4.4 Processing Stages
```prompt
Generate TypeScript implementations for common processing stages:
- Extends the base PipelineStage implementation
- Message enrichment stage
- Business logic stage
- Transaction preparation stage
- Blockchain submission stage
- Implements the ProcessingStage interface
- Handles blockchain preparation
- Include unit tests for each stage
```

## 5. Factory Layer Prompts

### 5.1 Pipeline Factories
```prompt
Generate TypeScript implementations for pipeline factories:
- Implement ValidationPipelineFactory
- Implement TransformationPipelineFactory
- Implement ProcessingPipelineFactory
- Support dynamic pipeline configuration
- Include appropriate stage instantiation
- Provide proper error handling
- Contains unit tests for factory operations
```

### 5.2 Message Type Registry
```prompt
Create a TypeScript implementation of the MessageTypeRegistry that:
- Implements the MessageTypeRegistry interface
- Manages pipeline factory registration
- Handles factory retrieval by message type
- Includes proper error handling for unknown types
- Provides factory validation
- Contains unit tests for registry operations
```

## 6. Adapter Layer Prompts

### 6.1 Blockchain Adapter
```prompt
Create a TypeScript implementation of the BlockchainAdapter that:
- Implements the BlockchainAdapter interface
- Handles blockchain configuration
- Manages transaction submission
- Implements transaction monitoring
- Provides retry mechanisms
- Includes comprehensive error handling
- Contains unit tests for blockchain interactions
```

## 7. Type Definitions Prompts

### 7.1 Message Type Definitions
```prompt
Create TypeScript type definitions for:
- Specific ISO 20022 message formats
- Extended pipeline contexts
- Custom validation rules
- Specific transaction types
- Error type hierarchies
- Include proper JSDoc documentation
```

## 8. Configuration Prompts

### 8.1 System Configuration
```prompt
Generate TypeScript configuration structures for:
- Service configurations
- Pipeline configurations
- Stage configurations
- Validation rules
- Blockchain settings
- Logging configuration
- Include configuration validation
```

## Usage Instructions

1. Use these prompts as templates for generating specific components
2. Customize the prompts based on specific requirements
3. Include any additional context or constraints
4. Specify any dependencies or integration requirements
5. Add specific error handling or logging requirements
6. Include performance or scalability requirements
7. Specify any security considerations

## Notes

- Each prompt should be customized based on specific project requirements
- Add relevant context and examples when using the prompts
- Include any specific coding standards or conventions
- Specify required dependencies and versions
- Include any specific testing requirements
- Add performance and security considerations
```
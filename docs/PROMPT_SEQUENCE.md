# ISO 20022 Message Processing System - Prompt Execution Sequence

## Phase 1: Foundation Components
Start with the core components that other parts of the system depend on. These components have minimal dependencies themselves.

### 1.1. Type Definitions (Section 7)
**Rationale**: Begin here because these types will be used throughout the entire system.
1. Create base message type definitions
2. Define pipeline context types
3. Define error types
4. Define validation rule types
5. Define transaction types

### 1.2. Configuration Structures (Section 8)
**Rationale**: Configuration structures inform how components will be instantiated and configured.
1. Define service configurations
2. Create pipeline configurations
3. Establish validation rule structures
4. Define blockchain settings
5. Set up logging configuration

### 1.3. Base Pipeline Implementation (Section 3.1)
**Rationale**: This base implementation will be extended by all specific pipeline types.
1. Implement Pipeline interface
2. Create stage management functionality
3. Implement metrics collection
4. Add dependency management
5. Establish error handling patterns

### 1.4. Base Stage Implementation (Section 4.1)
**Rationale**: Similar to base pipeline, this will be extended by all specific stage types.
1. Implement PipelineStage interface
2. Add configuration support
3. Implement dependency management
4. Add metrics collection
5. Establish error handling

## Phase 2: Pipeline Components
Build specific pipeline implementations that extend the base pipeline.

### 2.1. Pipeline Implementations
**Execute in this order**:
1. Validation Pipeline (Section 3.2)
2. Transformation Pipeline (Section 3.3)
3. Processing Pipeline (Section 3.4)

**Rationale**: This sequence follows the natural flow of message processing.

### 2.2. Stage Implementations
**Execute in this order for each pipeline type**:
1. Validation Stages (Section 4.2)
   - XML Schema validation
   - Business rule validation
   - Field format validation
   - Cross-field validation

2. Transformation Stages (Section 4.3)
   - XML parsing
   - Field mapping
   - Data enrichment
   - Format conversion

3. Processing Stages (Section 4.4)
   - Message enrichment
   - Business logic
   - Transaction preparation
   - Blockchain submission

## Phase 3: Factory Layer
Implement factories that create and configure pipeline instances.

### 3.1. Pipeline Factories (Section 5.1)
**Execute in this order**:
1. ValidationPipelineFactory
2. TransformationPipelineFactory
3. ProcessingPipelineFactory

### 3.2. Message Type Registry (Section 5.2)
**Rationale**: Implement after factories as it depends on them.
1. Implement registry interface
2. Add factory registration
3. Implement factory retrieval
4. Add error handling

## Phase 4: Service Layer
Implement services that coordinate pipeline execution.

### 4.1. Individual Services
**Execute in this order**:
1. Validation Service (Section 2.2)
2. Transformation Service (Section 2.3)
3. Processing Service (Section 2.4)

**Rationale**: This matches the message flow and allows testing each step independently.

### 4.2. Message Processing Service (Section 2.1)
**Rationale**: Implement after individual services as it orchestrates them.
1. Implement IMessageProcessingService
2. Add service coordination
3. Implement error handling
4. Add monitoring and logging

## Phase 5: External Integration

### 5.1. Blockchain Adapter (Section 6.1)
**Rationale**: Can be implemented in parallel with other components but needed for end-to-end testing.
1. Implement BlockchainAdapter interface
2. Add transaction submission
3. Implement monitoring
4. Add retry mechanisms

### 5.2. Controller Layer (Section 1.1)
**Rationale**: Implement last as it depends on the MessageProcessingService.
1. Create REST endpoints
2. Add authentication/authorization
3. Implement error handling
4. Add request validation

## Testing Strategy

### For Each Phase:
1. **Unit Tests**: Write as you implement each component
2. **Integration Tests**: Write after completing each phase
3. **End-to-End Tests**: Add after completing all phases

### Cross-Component Testing:
- Test pipeline combinations after Phase 2
- Test service interactions after Phase 4
- Perform full flow testing after Phase 5

## Implementation Tips

1. **For Each Component**:
   - Start with interface implementation
   - Add core functionality
   - Implement error handling
   - Add logging/monitoring
   - Write tests
   - Add documentation

2. **Between Phases**:
   - Verify all tests pass
   - Perform integration testing
   - Update documentation
   - Review error handling
   - Check logging coverage

3. **General Guidelines**:
   - Use TDD where possible
   - Maintain consistent error handling
   - Document as you go
   - Use dependency injection
   - Follow SOLID principles

## Dependency Management

Keep track of dependencies between components:
- Base implementations → Specific implementations
- Stages → Pipelines
- Pipelines → Services
- Services → Message Processing Service
- Message Processing Service → Controller

## Error Handling Strategy

Implement consistent error handling across all components:
1. Define error types in Phase 1
2. Implement base error handling in base classes
3. Extend error handling in specific implementations
4. Add service-level error management
5. Implement controller-level error responses

## Monitoring and Logging

Add monitoring and logging capabilities incrementally:
1. Basic logging in base implementations
2. Component-specific metrics in each implementation
3. Service-level monitoring
4. End-to-end transaction tracking
5. API-level request/response logging

## Documentation Requirements

For each component:
1. Interface documentation
2. Implementation details
3. Configuration options
4. Error handling approaches
5. Usage examples
6. Testing strategies

## Review Points

After each phase, review:
1. Code quality and consistency
2. Test coverage
3. Error handling completeness
4. Documentation accuracy
5. Performance implications
6. Security considerations

## Success Criteria

Define completion criteria for each phase:
1. All tests passing
2. Documentation complete
3. Error handling verified
4. Performance benchmarks met
5. Security requirements satisfied
```
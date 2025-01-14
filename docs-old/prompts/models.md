# TypeORM Model Generation Prompt

## Input Parameters
Please provide the following information to generate the TypeORM models:

1. Module Name: [Name of the feature module, e.g., "messages", "institutions"]
2. Model Names: [List of models to be generated for this module]
3. Existing Models: [List any existing models that these new models will relate to]
4. Special Requirements: [Any specific requirements for this module's models]

## Model Generation Requirements

For each model, the following aspects must be addressed:

### 1. Base Entity Configuration
- Include TypeORM's `BaseEntity` or custom base entity
- Standard fields: id, created_at, updated_at, deleted_at
- Proper table naming convention (snake_case)
- Schema designation if applicable
- Proper TypeScript types and interfaces

### 2. Column Definitions
For each column, specify:
- Data type and TypeORM decorator
- Column constraints (nullable, unique, etc.)
- Default values if any
- Precision and scale for numeric fields
- Length for string fields
- Indices and their types
- Custom column transformers if needed

### 3. Relationships
Define all:
- One-to-One relationships
- One-to-Many relationships
- Many-to-Many relationships
- Eager/Lazy loading strategy
- Cascade options
- Referential integrity constraints
- Join columns and tables

### 4. Validation Rules
Include:
- Class validator decorators
- Custom validation rules
- Validation groups if needed
- Error messages
- Validation patterns/regex

### 5. Indices and Performance
Specify:
- Primary key strategy
- Index decorators (unique, partial, etc.)
- Composite indices
- Full-text search indices if needed
- Performance optimization hints

### 6. Documentation Requirements
Include:
- JSDoc comments for the class
- Property documentation
- Relationship documentation
- Usage examples
- Important notes about constraints or business rules

### 7. Migration Strategy
Consider:
- Initial migration script
- Change management strategy
- Rollback procedures
- Data seeding requirements

### 8. Additional Features
Include where applicable:
- Hooks (@BeforeInsert, @AfterLoad, etc.)
- Custom methods
- JSON transformation rules
- Encryption requirements
- Audit logging requirements

## Example Output Format

```typescript
/**
 * [Model Name] Entity
 * 
 * [Description of the entity and its purpose]
 * 
 * @remarks
 * [Any important notes about usage or constraints]
 */
@Entity({ name: 'table_name', schema: 'schema_name' })
@Index(['field1', 'field2'])
export class ModelName extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Standard tracking fields
    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at?: Date;

    // Custom fields
    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
        unique: true
    })
    @MinLength(3)
    @MaxLength(255)
    @IsNotEmpty()
    field1: string;

    // Relationships
    @ManyToOne(() => RelatedEntity, (entity) => entity.fieldName)
    @JoinColumn({ name: 'related_entity_id' })
    relatedEntity: RelatedEntity;

    // Hooks
    @BeforeInsert()
    async beforeInsert() {
        // Hook logic
    }

    // Custom methods
    async customMethod(): Promise<void> {
        // Method implementation
    }
}

// Associated migration file
export class CreateModelName1234567890 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            // Table definition
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback logic
    }
}
```

## Response Format

The response should include:
1. Complete TypeScript code for each model
2. Associated migration files
3. Any necessary index files
4. Documentation comments
5. Implementation notes or warnings
6. Testing recommendations

## Testing Requirements

For each model, include:
1. Unit test template
2. Factory class for test data generation
3. Repository test cases
4. Validation test cases
5. Relationship test cases

## Additional Considerations
- Ensure all models follow consistent naming conventions
- Consider soft delete requirements
- Plan for future extensibility
- Consider performance implications of relationship choices
- Document any assumptions made
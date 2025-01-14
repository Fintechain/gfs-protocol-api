# API Documentation

## 1. Message Management API

### Core Endpoints

#### Message Creation and Management
- **Create Draft Message**
  - Path: `/api/messages/draft`
  - Method: POST
  - Description: Create a general message draft, supporting multiple protocols.

- **Update Draft**
  - Path: `/api/messages/draft/{draftId}`
  - Method: PUT
  - Description: Update draft content with basic protocol-level validation.

- **Retrieve Draft**
  - Path: `/api/messages/draft/{draftId}`
  - Method: GET
  - Description: Retrieve details of a specific draft.

#### Validation and Transformation
- **Validate Message**
  - Path: `/api/messages/validate`
  - Method: POST
  - Description: Perform advanced validation based on protocol rules (e.g., ISO 20022 Schema validation).

- **Transform Message**
  - Path: `/api/messages/transform`
  - Method: POST
  - Description: Cross-format transformation (e.g., ISO20022->FIX), supporting user-defined or default rules.

#### Message Processing
- **Generate Payload**
  - Path: `/api/messages/generate-payload`
  - Method: POST
  - Description: Generate a protocol-compliant payload based on a draft.

- **Submit Message**
  - Path: `/api/messages/submit`
  - Method: POST
  - Description: Submit a message to a payment network or blockchain, returning a transactionId.

#### Status and Tracking
- **Check Message Status**
  - Path: `/api/messages/{messageId}/status`
  - Method: GET
  - Description: Retrieve the current status of a message, supporting real-time updates.

- **View Message History**
  - Path: `/api/messages/{messageId}/history`
  - Method: GET
  - Description: View the history of status changes for a message.

#### Advanced Operations
- **Retry Message**
  - Path: `/api/messages/{messageId}/retry`
  - Method: POST
  - Description: Retry message submission after validation or network failures.

- **Cancel Message**
  - Path: `/api/messages/{messageId}/cancel`
  - Method: POST
  - Description: Cancel a message in progress.

### Entity Definitions

#### 1. Message Entity
| Field Name | Type | Description |
|------------|------|-------------|
| messageId | string | Unique identifier for the message |
| draftId | string | Identifier for the associated draft |
| protocol | string | Protocol type (e.g., ISO20022, SWIFT MT) |
| messageType | string | Type of the message (e.g., PACS.008, MT103) |
| payload | JSON | The complete message content |
| status | string | Current status (e.g., Draft, Validated, Submitted) |
| validationErrors | array | List of validation error messages |
| transactionHash | string | Blockchain transaction hash (if applicable) |
| createdAt | datetime | Timestamp when the message was created |
| updatedAt | datetime | Last updated timestamp |

#### 2. Event Entity
| Field Name | Type | Description |
|------------|------|-------------|
| eventId | string | Unique identifier for the event |
| messageId | string | Associated message identifier |
| eventType | string | Type of event (e.g., TransactionConfirmed, Error) |
| eventSource | string | Source of the event |
| details | JSON | Additional event details |
| timestamp | datetime | Timestamp when the event occurred |

## 2. Institution Management API

### Core Operations

#### Institution Management
- **Create Institution**
  - Path: `/api/institutions`
  - Method: POST
  - Description: Add a new financial institution.

- **List Institutions**
  - Path: `/api/institutions`
  - Method: GET
  - Description: Retrieve an overview of all institutions.

- **Get Institution Details**
  - Path: `/api/institutions/{id}`
  - Method: GET
  - Description: Retrieve detailed information about a specific institution.

#### Hierarchy Management
- **Create Sub-Institution**
  - Path: `/api/institutions/{id}/subaccounts`
  - Method: POST
  - Description: Create a new sub-institution under a specified institution.

- **Get Sub-Institutions**
  - Path: `/api/institutions/{id}/subaccounts`
  - Method: GET
  - Description: Retrieve information about sub-institutions.

### Entity Definitions

#### 1. Institution Entity
| Field Name | Type | Description |
|------------|------|-------------|
| id | String | Unique identifier for the institution |
| name | String | Name of the institution |
| metadata | JSON | Additional metadata |
| status | String | Status (active, inactive) |
| parentId | String | ID of the parent institution |
| createdAt | Date | Institution creation timestamp |
| updatedAt | Date | Last update timestamp |

#### 2. Sub-Institution Entity
| Field Name | Type | Description |
|------------|------|-------------|
| id | String | Unique identifier for the sub-institution |
| parentId | String | ID of the parent institution |
| name | String | Name of the sub-institution |
| metadata | JSON | Additional metadata |
| createdAt | Date | Creation timestamp |
| updatedAt | Date | Last update timestamp |

#### 3. Permission Entity
| Field Name | Type | Description |
|------------|------|-------------|
| id | String | Unique identifier for the permission |
| institutionId | String | Associated institution ID |
| userId | String | Associated user ID |
| role | String | Assigned role (admin, viewer, etc.) |
| modules | Array | List of accessible modules |
| createdAt | Date | Permission creation timestamp |
| updatedAt | Date | Last update timestamp |

## Security and Compliance

### Permission Management
- **Update Permissions**
  - Path: `/api/institutions/{id}/permissions`
  - Method: POST
  - Description: Modify user roles and permissions within an institution.

- **Get Permission Configuration**
  - Path: `/api/institutions/{id}/permissions`
  - Method: GET
  - Description: Retrieve permission assignments.

### Approval Workflows
- **Approve Institution**
  - Path: `/api/institutions/{id}/approve`
  - Method: POST
  - Description: Approve institution creation or modification.

- **Query Approval History**
  - Path: `/api/institutions/{id}/approvals`
  - Method: GET
  - Description: Retrieve approval records.

### Monitoring and Logging
- **Query Operation Logs**
  - Path: `/api/institutions/{id}/logs`
  - Method: GET
  - Description: Retrieve all operation logs.

- **Query Statistics**
  - Path: `/api/institutions/{id}/stats`
  - Method: GET
  - Description: Return message statistics and performance data.
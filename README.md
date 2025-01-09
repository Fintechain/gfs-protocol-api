# GFS Protocol API

## Overview

GFS Protocol API is a comprehensive financial messaging and blockchain integration platform designed to streamline message processing, institutional management, and cross-chain communication. Built with TypeScript and following a modular architecture, the system supports ISO20022 messaging, blockchain transactions, and robust compliance mechanisms.

## Key Features

- 🔐 Secure Authentication and Authorization
- 📬 ISO20022 Message Management
- 🏦 Institutional Hierarchy and Permissions
- ⛓️ Blockchain Integration
- 📊 Comprehensive Compliance Tracking
- 🔍 Advanced Message Search and Filtering

## System Architecture

The application is organized into several core modules:

1. **Messages Module**: 
   - ISO20022 message handling
   - Message validation and transformation
   - Blockchain transaction tracking

2. **Blockchain Module**:
   - Cross-chain communication
   - Smart contract interactions
   - Transaction monitoring

3. **Institutions Module**:
   - Financial institution management
   - Hierarchical permissions
   - Configuration tracking

4. **Events Module**:
   - Event handling
   - Notifications system
   - Webhook support

5. **Auth Module**:
   - User authentication
   - Role-based access control
   - Session management

6. **Compliance Module**:
   - Audit logging
   - Regulatory reporting
   - Compliance rule enforcement

## Prerequisites

> **Important!** Ts.ED requires Node >= 20.x or Bun.js and TypeScript >= 5.

## Installation

```bash
# install dependencies
$ npm install

# serve
$ npm run start

# build for production
$ npm run build
$ npm run start:prod
```

## Docker

```bash
# build docker image
docker compose build

# start docker image
docker compose up
```

## Barrels

This project uses [barrels](https://www.npmjs.com/package/@tsed/barrels) to generate index files to import the controllers.

Edit `.barrels.json` to customize it:

```json
{
  "directory": [
    "./src/controllers/rest",
    "./src/controllers/pages"
  ],
  "exclude": [
    "**/__mock__",
    "**/__mocks__",
    "**/*.spec.ts"
  ],
  "delete": true
}
```

## Configuration

Configure your application in `src/config`:
- `database.config.ts`: Database connection settings
- `blockchain.config.ts`: Blockchain network configurations
- `auth.config.ts`: Authentication parameters
- `app.config.ts`: General application settings

## Testing

The project uses a comprehensive testing strategy:

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Generate test coverage report
npm run test:coverage
```

Key testing components:
- Vitest for unit testing
- SuperTest for API testing
- TestContainers for integration tests

## API Endpoints

### Message Management
#### Message Creation and Management
- `POST /api/messages/draft`: Create a general message draft
- `PUT /api/messages/draft/{draftId}`: Update draft content
- `GET /api/messages/draft/{draftId}`: Retrieve draft details

#### Validation and Transformation
- `POST /api/messages/validate`: Perform advanced protocol validation
- `POST /api/messages/transform`: Cross-format message transformation
- `POST /api/messages/generate-payload`: Generate protocol-compliant payload

#### Message Processing
- `POST /api/messages/submit`: Submit message to payment network or blockchain

#### Status and Tracking
- `GET /api/messages/{messageId}/status`: Check message status in real-time
- `GET /api/messages/{messageId}/history`: View message status history

#### Advanced Operations
- `POST /api/messages/{messageId}/retry`: Retry message submission
- `POST /api/messages/{messageId}/cancel`: Cancel in-progress message

### Institution Management
#### Institution Operations
- `POST /api/institutions`: Add a new financial institution
- `GET /api/institutions`: Retrieve overview of all institutions
- `GET /api/institutions/{id}`: Get detailed institution information

#### Hierarchy Management
- `POST /api/institutions/{id}/subaccounts`: Create sub-institution
- `GET /api/institutions/{id}/subaccounts`: Retrieve sub-institutions

### Security and Compliance
#### Permission Management
- `POST /api/institutions/{id}/permissions`: Modify user roles and permissions
- `GET /api/institutions/{id}/permissions`: Retrieve permission assignments

#### Approval Workflows
- `POST /api/institutions/{id}/approve`: Approve institution creation/modification
- `GET /api/institutions/{id}/approvals`: Query approval history

#### Monitoring
- `GET /api/institutions/{id}/logs`: Retrieve operation logs
- `GET /api/institutions/{id}/stats`: Get message statistics and performance data

## Security

- Role-based access control
- JWT authentication
- Input validation
- Rate limiting
- Comprehensive audit logging

## Performance Characteristics

- Message processing: < 1 second
- Batch processing: Up to 1000 messages
- Validation time: Maximum 2 seconds
- Uptime target: 99.9%

## Deployment

Recommended deployment environments:
- Kubernetes
- Docker Swarm
- Cloud Platforms (AWS, GCP, Azure)

## Compliance

Supports various regulatory frameworks with built-in:
- Audit trails
- Compliance reporting
- Rule-based validation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Project Maintainer - [Your Name]
Project Link: https://github.com/your-org/gfs-protocol-api

## Acknowledgements

- TypeScript
- TSEd Framework
- PostgreSQL
- Redis
- Vitest
- TestContainers
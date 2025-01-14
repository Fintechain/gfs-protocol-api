This controller structure provides:

1. **Clear API Organization**:
- Separate controllers for different concerns (drafts, messages, validation, etc.)
- RESTful endpoint design matching API.md specifications
- Each controller focuses on a specific aspect of message handling

2. **Integration with Services**:
- Controllers use our previously defined services
- Clear separation between HTTP layer and business logic
- Proper dependency injection

3. **Comprehensive DTOs**:
- Well-defined input/output types
- Validation built into the DTOs
- Clear response structures

4. **Error Handling**:
- Global exception filter
- Specific error types for different scenarios
- Consistent error response format

5. **Protocol Alignment**:
- All submissions go through ProtocolService to ProtocolCoordinator
- Proper handling of ISO20022 messages
- Support for blockchain-specific features

The flow for a typical message submission would be:
```
1. Client submits ISO20022 XML to /api/messages/submit
2. MessageController receives request
3. ProtocolService:
   - Validates ISO20022 format
   - Prepares protocol submission
   - Calculates fees
   - Submits to ProtocolCoordinator
4. Response includes messageId and initial status
5. Client can track status via /api/messages/{messageId}/status
```

// MessageDraftController - /api/messages/draft
@Controller('/messages/draft')
export class MessageDraftController {
    constructor(
        private draftService: DraftManagementService,
        private iso20022Service: ISO20022MessageService
    ) {}

    @Post()
    async createDraft(@Body() payload: CreateDraftDTO): Promise<MessageDraft> {
        return this.draftService.createDraft(payload.xml);
    }

    @Put('/:draftId')
    async updateDraft(
        @Param('draftId') draftId: string,
        @Body() payload: UpdateDraftDTO
    ): Promise<MessageDraft> {
        return this.draftService.updateDraft(draftId, payload.xml);
    }

    @Get('/:draftId')
    async getDraft(@Param('draftId') draftId: string): Promise<MessageDraft> {
        return this.draftService.getDraft(draftId);
    }
}

// MessageController - /api/messages
@Controller('/messages')
export class MessageController {
    constructor(
        private protocolService: ProtocolService,
        private messageTrackingService: MessageTrackingService,
        private iso20022Service: ISO20022MessageService
    ) {}

    @Post('/submit')
    async submitMessage(@Body() payload: SubmitMessageDTO): Promise<SubmitMessageResponse> {
        // Submit through protocol coordinator
        const messageId = await this.protocolService.submitMessage(payload.xml);
        return { messageId };
    }

    @Get('/:messageId/status')
    async getMessageStatus(@Param('messageId') messageId: string): Promise<MessageStatus> {
        return this.messageTrackingService.trackMessage(messageId);
    }

    @Get('/:messageId/history')
    async getMessageHistory(@Param('messageId') messageId: string): Promise<MessageHistory> {
        return this.messageTrackingService.getMessageHistory(messageId);
    }

    @Post('/:messageId/retry')
    async retryMessage(
        @Param('messageId') messageId: string,
        @Body() payload: RetryMessageDTO
    ): Promise<RetryResponse> {
        return this.protocolService.retryMessage(messageId, payload);
    }

    @Post('/:messageId/cancel')
    async cancelMessage(@Param('messageId') messageId: string): Promise<CancelResponse> {
        return this.protocolService.cancelMessage(messageId);
    }
}

// ValidationController - /api/messages/validate
@Controller('/messages/validate')
export class ValidationController {
    constructor(
        private iso20022Service: ISO20022MessageService,
        private messagePreprocessor: MessagePreprocessor
    ) {}

    @Post()
    async validateMessage(@Body() payload: ValidateMessageDTO): Promise<ValidationResult> {
        // Two-step validation process
        // 1. ISO20022 format validation
        const formatValidation = await this.iso20022Service.validateMessage(payload.xml);
        
        // 2. Protocol-specific validation
        if (formatValidation.isValid) {
            const parsedMessage = await this.iso20022Service.parseMessage(payload.xml);
            return this.messagePreprocessor.validateForProtocol(parsedMessage);
        }
        
        return formatValidation;
    }
}

// TransformationController - /api/messages/transform
@Controller('/messages/transform')
export class TransformationController {
    constructor(private iso20022Service: ISO20022MessageService) {}

    @Post()
    async transformMessage(@Body() payload: TransformMessageDTO): Promise<TransformResult> {
        // Transform message between formats (e.g., ISO20022 to internal format)
        const parsedMessage = await this.iso20022Service.parseMessage(payload.xml);
        const targetFormat = payload.targetFormat || 'protocol';
        
        return this.iso20022Service.transformMessage(parsedMessage, targetFormat);
    }
}

// DTOs
export interface CreateDraftDTO {
    xml: string;
    metadata?: Record<string, any>;
}

export interface UpdateDraftDTO {
    xml: string;
    metadata?: Record<string, any>;
}

export interface SubmitMessageDTO {
    xml: string;
    options?: {
        targetChain?: number;
        urgent?: boolean;
    };
}

export interface ValidateMessageDTO {
    xml: string;
    messageType?: string;
}

export interface TransformMessageDTO {
    xml: string;
    targetFormat: string;
}

export interface RetryMessageDTO {
    options?: {
        urgent?: boolean;
        maxFee?: string;
    };
}

// Response Types
export interface ValidationResult {
    isValid: boolean;
    errors?: Array<{
        code: string;
        message: string;
        severity: 'ERROR' | 'WARNING';
        field?: string;
    }>;
}

export interface MessageStatus {
    messageId: string;
    status: string;
    protocolStatus: string;
    settlementStatus?: string;
    lastUpdated: Date;
    transactionHash?: string;
    details: Record<string, any>;
}

export interface MessageHistory {
    messageId: string;
    events: Array<{
        timestamp: Date;
        status: string;
        details: Record<string, any>;
    }>;
}

export interface SubmitMessageResponse {
    messageId: string;
    status: string;
    transactionHash?: string;
}

export interface RetryResponse {
    messageId: string;
    newTransactionHash?: string;
    status: string;
}

export interface CancelResponse {
    messageId: string;
    status: string;
    reason?: string;
}

// Error Handling
@Catch()
export class MessageExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        
        if (exception instanceof ValidationError) {
            status = HttpStatus.BAD_REQUEST;
            message = 'Validation failed';
        } else if (exception instanceof ProtocolError) {
            status = HttpStatus.BAD_REQUEST;
            message = exception.message;
        }
        
        response.status(status).json({
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
            details: exception.details || null
        });
    }
}
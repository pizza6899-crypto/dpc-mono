import { MessageCode } from '../constants/message-codes';

export interface ErrorResponse {
    success: boolean;
    errorCode: MessageCode;
    message: string;
    timestamp: string;
}

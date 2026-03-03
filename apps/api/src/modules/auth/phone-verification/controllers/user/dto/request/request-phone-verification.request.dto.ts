import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class RequestPhoneVerificationRequestDto {
    @ApiProperty({
        description: 'Phone number to verify (E.164 format recommended)',
        example: '+821012345678',
    })
    @IsString()
    // 간단한 전화번호 형식 체크 (국가코드 포함)
    @Matches(/^\+[1-9]\d{1,14}$/, {
        message: 'Phone number must be in E.164 format (e.g., +821012345678)',
    })
    phoneNumber: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class VerifyPhoneRequestDto {
    @ApiProperty({
        description: 'The phone number that was used for verification',
        example: '+821012345678',
    })
    @IsString()
    @Matches(/^\+[1-9]\d{1,14}$/, {
        message: 'Phone number must be in E.164 format (e.g., +821012345678)',
    })
    phoneNumber: string;

    @ApiProperty({
        description: '6-digit verification code',
        example: '123456',
    })
    @IsString()
    @Length(6, 6)
    code: string;
}

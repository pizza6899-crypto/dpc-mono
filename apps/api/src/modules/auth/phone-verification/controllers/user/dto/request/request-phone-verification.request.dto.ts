import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class RequestPhoneVerificationRequestDto {
    @ApiProperty({
        description: 'Phone number to verify (E.164 format recommended) / 인증할 휴대폰 번호 (E.164 형식 권장)',
        example: '+821012345678',
    })
    @IsNotEmpty()
    @IsString()
    @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[\s-]/g, '') : value))
    @IsPhoneNumber(undefined, {
        message: 'Invalid phone number format. Please use E.164 format (e.g., +821012345678)',
    })
    phoneNumber: string;
}

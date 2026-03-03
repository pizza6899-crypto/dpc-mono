import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumberString, IsPhoneNumber, IsString, Length } from 'class-validator';

export class VerifyPhoneRequestDto {
    @ApiProperty({
        description: 'The phone number that was used for verification / 인증에 사용된 휴대폰 번호',
        example: '+821012345678',
    })
    @IsNotEmpty()
    @IsString()
    @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[\s-]/g, '') : value))
    @IsPhoneNumber(undefined, {
        message: 'Invalid phone number format. Please use E.164 format (e.g., +821012345678)',
    })
    phoneNumber: string;

    @ApiProperty({
        description: '6-digit verification code / 6자리 인증번호',
        example: '123456',
    })
    @IsString()
    @IsNumberString()
    @Length(2, 6)
    code: string;
}

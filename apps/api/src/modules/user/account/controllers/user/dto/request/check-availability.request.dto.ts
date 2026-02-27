import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum AvailabilityField {
    NICKNAME = 'nickname',
    EMAIL = 'email',
    LOGIN_ID = 'loginId',
    PHONE_NUMBER = 'phoneNumber',
}

export class CheckAvailabilityRequestDto {
    @ApiProperty({
        description: 'Field to check / 중복 검사할 필드',
        enum: AvailabilityField,
    })
    @IsEnum(AvailabilityField)
    field: AvailabilityField;

    @ApiProperty({
        description: 'Value to check / 중복 검사할 값',
    })
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    value: string;
}

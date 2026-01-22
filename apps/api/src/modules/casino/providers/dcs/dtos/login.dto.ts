import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { DcsBaseRequestDto, DcsCommonResponseDto } from './base.dto';

export class LoginRequestDto extends DcsBaseRequestDto {
    @ApiProperty({
        description: 'Token created by operator',
        example: 'abc123XYZ456',
    })
    @IsString()
    @IsNotEmpty()
    token: string;
}

export class DcsLoginResponseDto extends DcsCommonResponseDto { }

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class DecodeSqidRequestDto {
    @ApiProperty({
        description: '디코딩할 Sqid 문자열 (접두사 포함/미포함 모두 가능)',
        example: 'u_abc123xyz',
    })
    @IsString()
    @IsNotEmpty()
    sqid: string;
}

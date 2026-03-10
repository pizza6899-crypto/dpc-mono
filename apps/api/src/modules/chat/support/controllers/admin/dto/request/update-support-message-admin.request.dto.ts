import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateSupportMessageAdminRequestDto {
    @ApiProperty({
        description: 'Modified message content / 수정할 메시지 내용',
        example: '수정된 답변입니다.',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    content: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateGameProviderRequestDto {
    @ApiPropertyOptional({ description: 'Provider name / 게임사 이름' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({
        description: 'Logo image ID (File ID from /file/upload) / 로고 이미지 ID (파일 업로드 API 결과값)',
        example: 'f_abc123'
    })
    @IsString()
    @IsOptional()
    imageId?: string;

    @ApiPropertyOptional({ description: 'Is active / 활성화 여부' })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

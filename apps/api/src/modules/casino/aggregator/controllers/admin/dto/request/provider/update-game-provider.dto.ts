import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateGameProviderRequestDto {
    @ApiPropertyOptional({ description: 'Provider name / 게임사 이름' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({ description: 'Brand group code / 브랜드 그룹 코드' })
    @IsString()
    @IsOptional()
    groupCode?: string;

    @ApiPropertyOptional({ description: 'Logo image ID / 로고 이미지 ID (File ID)' })
    @IsString()
    @IsOptional()
    imageId?: string;

    @ApiPropertyOptional({ description: 'Is active / 활성화 여부' })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Language } from '@repo/database';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class GameTranslationRequestDto {
    @ApiProperty({ enum: Language })
    @IsNotEmpty()
    language: Language;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;
}

export class CreateGameAdminRequestDto {
    @ApiProperty({ description: 'Provider ID (Sqid)' })
    @IsString()
    @IsNotEmpty()
    providerId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    externalGameId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    thumbnailUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    bannerUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    rtp?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    volatility?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    gameType?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    tableId?: string;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    houseEdge?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    contributionRate?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    sortOrder?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isEnabled?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isVisible?: boolean;

    @ApiProperty({ type: [GameTranslationRequestDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => GameTranslationRequestDto)
    translations: GameTranslationRequestDto[];
}

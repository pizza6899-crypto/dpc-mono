// apps/api/src/modules/notification/template/controllers/admin/dto/request/create-template.request.dto.ts

import { IsString, IsEnum, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ChannelType } from '@repo/database';

class CreateTranslationDto {
    @IsString()
    locale: string;

    @IsString()
    titleTemplate: string;

    @IsString()
    bodyTemplate: string;

    @IsOptional()
    @IsString()
    actionUriTemplate?: string;
}

export class CreateTemplateRequestDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    event: string;

    @IsEnum(ChannelType)
    channel: ChannelType;

    @IsArray()
    @IsString({ each: true })
    variables: string[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateTranslationDto)
    translations?: CreateTranslationDto[];
}

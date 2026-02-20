import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ChannelType, Language } from '@prisma/client';
import { NOTIFICATION_EVENTS } from '../../../../../common';

class UpdateTranslationDto {
  @ApiProperty({ description: 'Locale', enum: Language, example: Language.EN })
  @IsEnum(Language)
  locale: Language;

  @ApiProperty({ description: 'Title template', example: 'Welcome, {{name}}!' })
  @IsString()
  titleTemplate: string;

  @ApiProperty({
    description: 'Body template',
    example: 'Hello {{name}}, welcome to our service.',
  })
  @IsString()
  bodyTemplate: string;

  @ApiProperty({
    description: 'Action URI template',
    example: '/profile',
    required: false,
  })
  @IsOptional()
  @IsString()
  actionUriTemplate?: string;
}

export class UpdateTemplateRequestDto {
  @ApiProperty({
    description: 'Template name',
    example: 'Welcome Email',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Description',
    example: 'Sent when a new user joins',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Event name',
    enum: NOTIFICATION_EVENTS,
    example: NOTIFICATION_EVENTS.USER_REGISTERED,
    required: false,
  })
  @IsOptional()
  @IsEnum(NOTIFICATION_EVENTS)
  event?: string;

  @ApiProperty({
    description: 'Channel type',
    enum: ChannelType,
    example: ChannelType.EMAIL,
    required: false,
  })
  @IsOptional()
  @IsEnum(ChannelType)
  channel?: ChannelType;

  @ApiProperty({
    description: 'Variables used in template',
    example: ['name', 'expiry_date'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];

  @ApiProperty({ type: [UpdateTranslationDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTranslationDto)
  translations?: UpdateTranslationDto[];
}

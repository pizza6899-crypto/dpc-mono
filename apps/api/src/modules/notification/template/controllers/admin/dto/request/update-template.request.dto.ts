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
  @ApiProperty({
    description: 'Locale / 언어',
    enum: Language,
    example: Language.EN,
  })
  @IsEnum(Language)
  locale: Language;

  @ApiProperty({
    description: 'Title template / 제목 템플릿',
    example: 'Welcome, {{name}}!',
  })
  @IsString()
  titleTemplate: string;

  @ApiProperty({
    description: 'Body template / 본문 템플릿',
    example: 'Hello {{name}}, welcome to our service.',
  })
  @IsString()
  bodyTemplate: string;

  @ApiProperty({
    description: 'Action URI template / 액션 URI 템플릿',
    example: '/profile',
    required: false,
  })
  @IsOptional()
  @IsString()
  actionUriTemplate?: string;
}

export class UpdateTemplateRequestDto {
  @ApiProperty({
    description: 'Template name / 템플릿 이름',
    example: 'Welcome Email',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Description / 설명',
    example: 'Sent when a new user joins',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Event name / 이벤트 이름',
    enum: NOTIFICATION_EVENTS,
    example: NOTIFICATION_EVENTS.INBOX_NEW,
    required: false,
  })
  @IsOptional()
  @IsEnum(NOTIFICATION_EVENTS)
  event?: string;

  @ApiProperty({
    description: 'Channel type / 채널 타입',
    enum: ChannelType,
    example: ChannelType.EMAIL,
    required: false,
  })
  @IsOptional()
  @IsEnum(ChannelType)
  channel?: ChannelType;

  @ApiProperty({
    description: 'Variables used in template / 템플릿에서 사용되는 변수',
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

import { ApiProperty } from '@nestjs/swagger';
import { ChannelType } from '@prisma/client';

export class TemplateTranslationResponseDto {
  @ApiProperty({ description: 'Locale', example: 'en' })
  locale: string;

  @ApiProperty({ description: 'Title template', example: 'Welcome, {{name}}!' })
  titleTemplate: string;

  @ApiProperty({
    description: 'Body template',
    example: 'Hello {{name}}, welcome to our service.',
  })
  bodyTemplate: string;

  @ApiProperty({
    description: 'Action URI template',
    example: '/profile',
    required: false,
    nullable: true,
  })
  actionUriTemplate: string | null;
}

export class TemplateResponseDto {
  @ApiProperty({ description: 'Template ID', example: 'nt_123456' })
  id: string;

  @ApiProperty({ description: 'Template name', example: 'Welcome Email' })
  name: string;

  @ApiProperty({
    description: 'Description',
    example: 'Sent when a new user joins',
    required: false,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ description: 'Event name', example: 'user.registered' })
  event: string;

  @ApiProperty({
    description: 'Channel type',
    enum: ChannelType,
    example: ChannelType.EMAIL,
  })
  channel: ChannelType;

  @ApiProperty({
    description: 'Variables used in template',
    example: ['name', 'expiry_date'],
  })
  variables: string[];

  @ApiProperty({ type: [TemplateTranslationResponseDto] })
  translations: TemplateTranslationResponseDto[];

  @ApiProperty({ description: 'Updated date', example: '2024-01-01T00:00:00Z' })
  updatedAt: string;
}

export class TemplateListItemResponseDto {
  @ApiProperty({ description: 'Template ID', example: 'nt_123456' })
  id: string;

  @ApiProperty({ description: 'Template name', example: 'Welcome Email' })
  name: string;

  @ApiProperty({
    description: 'Description',
    example: 'Sent when a new user joins',
    required: false,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ description: 'Event name', example: 'user.registered' })
  event: string;

  @ApiProperty({
    description: 'Channel type',
    enum: ChannelType,
    example: ChannelType.EMAIL,
  })
  channel: ChannelType;

  @ApiProperty({
    description: 'Variables used in template',
    example: ['name', 'expiry_date'],
  })
  variables: string[];

  @ApiProperty({ description: 'Number of translations', example: 2 })
  translationsCount: number;

  @ApiProperty({ type: [TemplateTranslationResponseDto] })
  translations: TemplateTranslationResponseDto[];

  @ApiProperty({ description: 'Updated date', example: '2024-01-01T00:00:00Z' })
  updatedAt: string;
}

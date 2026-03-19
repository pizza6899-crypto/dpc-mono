import { ApiProperty } from '@nestjs/swagger';
import { ChannelType } from '@prisma/client';

export class TemplateTranslationResponseDto {
  @ApiProperty({ description: 'Locale / 언어', example: 'en' })
  locale: string;

  @ApiProperty({
    description: 'Title template / 제목 템플릿',
    example: 'Welcome, {{name}}!',
  })
  titleTemplate: string;

  @ApiProperty({
    description: 'Body template / 본문 템플릿',
    example: 'Hello {{name}}, welcome to our service.',
  })
  bodyTemplate: string;

  @ApiProperty({
    description: 'Action URI template / 액션 URI 템플릿',
    example: '/profile',
    required: false,
    nullable: true,
  })
  actionUriTemplate: string | null;
}

export class TemplateResponseDto {
  @ApiProperty({ description: 'Template ID / 템플릿 ID', example: 'nt_123456' })
  id: string;

  @ApiProperty({
    description: 'Template name / 템플릿 이름',
    example: 'Welcome Email',
  })
  name: string;

  @ApiProperty({
    description: 'Description / 설명',
    example: 'Sent when a new user joins',
    required: false,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Event name / 이벤트 이름',
    example: 'user.registered',
  })
  event: string;

  @ApiProperty({
    description: 'Channel type / 채널 타입',
    enum: ChannelType,
    example: ChannelType.EMAIL,
  })
  channel: ChannelType;

  @ApiProperty({
    description: 'Variables used in template / 템플릿에서 사용되는 변수',
    example: ['name', 'expiry_date'],
  })
  variables: string[];

  @ApiProperty({ type: [TemplateTranslationResponseDto] })
  translations: TemplateTranslationResponseDto[];

  @ApiProperty({
    description: 'Updated date / 업데이트 날짜',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt: string;
}

export class TemplateListItemResponseDto {
  @ApiProperty({ description: 'Template ID / 템플릿 ID', example: 'nt_123456' })
  id: string;

  @ApiProperty({
    description: 'Template name / 템플릿 이름',
    example: 'Welcome Email',
  })
  name: string;

  @ApiProperty({
    description: 'Description / 설명',
    example: 'Sent when a new user joins',
    required: false,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Event name / 이벤트 이름',
    example: 'user.registered',
  })
  event: string;

  @ApiProperty({
    description: 'Channel type / 채널 타입',
    enum: ChannelType,
    example: ChannelType.EMAIL,
  })
  channel: ChannelType;

  @ApiProperty({
    description: 'Variables used in template / 템플릿에서 사용되는 변수',
    example: ['name', 'expiry_date'],
  })
  variables: string[];

  @ApiProperty({ description: 'Number of translations / 번역 수', example: 2 })
  translationsCount: number;

  @ApiProperty({ type: [TemplateTranslationResponseDto] })
  translations: TemplateTranslationResponseDto[];

  @ApiProperty({
    description: 'Updated date / 업데이트 날짜',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt: string;
}

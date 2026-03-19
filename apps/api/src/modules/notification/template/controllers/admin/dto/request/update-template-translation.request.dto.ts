// apps/api/src/modules/notification/template/controllers/admin/dto/request/update-template-translation.request.dto.ts

import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTemplateTranslationRequestDto {
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

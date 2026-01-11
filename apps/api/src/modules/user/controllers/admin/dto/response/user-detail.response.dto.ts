// src/modules/user/controllers/admin/dto/response/user-detail.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { UserRoleType, UserStatus } from '@repo/database';
import type { User } from '../../../../domain/model/user.entity';

export class UserDetailResponseDto {
    @ApiProperty({ description: '사용자 ID', example: '1234567890...' })
    id: string;

    @ApiProperty({ description: '이메일', example: 'user@example.com' })
    email: string;

    @ApiProperty({ description: '사용자 역할', enum: UserRoleType })
    role: UserRoleType;

    @ApiProperty({ description: '사용자 상태', enum: UserStatus })
    status: UserStatus;

    @ApiProperty({ description: '국가 코드', example: 'KR', nullable: true })
    country: string | null;

    @ApiProperty({ description: '타임존', example: 'Asia/Seoul', nullable: true })
    timezone: string | null;

    @ApiProperty({ description: '가입일' })
    createdAt: Date;

    @ApiProperty({ description: '최종 수정일' })
    updatedAt: Date;

    constructor(user: User) {
        this.id = user.id.toString();
        this.email = user.email;
        this.role = user.role;
        this.status = user.status;
        this.country = user.getLocation().country;
        this.timezone = user.getLocation().timezone;
        this.createdAt = user.createdAt;
        this.updatedAt = user.updatedAt;
    }
}

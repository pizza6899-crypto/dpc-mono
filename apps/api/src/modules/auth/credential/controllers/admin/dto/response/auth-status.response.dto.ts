import { ApiProperty } from '@nestjs/swagger';
import { CredentialAdminLoginUserResponseDto } from './login.response.dto';

export class CredentialAdminAuthStatusResponseDto {
    @ApiProperty({ description: '인증 여부' })
    isAuthenticated: boolean;

    @ApiProperty({
        type: CredentialAdminLoginUserResponseDto,
        required: false,
        nullable: true,
    })
    user: CredentialAdminLoginUserResponseDto | null;
}

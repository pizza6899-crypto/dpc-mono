import { ApiProperty } from '@nestjs/swagger';

export class CredentialAdminLoginUserResponseDto {
    @ApiProperty({ description: '관리자 ID' })
    id: string;

    @ApiProperty({ description: '관리자 이메일' })
    email: string;
}

export class CredentialAdminLoginResponseDto {
    @ApiProperty({ type: CredentialAdminLoginUserResponseDto })
    user: CredentialAdminLoginUserResponseDto;
}

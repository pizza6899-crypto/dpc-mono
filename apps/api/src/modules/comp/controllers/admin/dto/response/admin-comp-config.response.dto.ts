import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';

export class AdminCompConfigResponseDto {
    @ApiProperty({ description: 'Config ID / 설정 ID' })
    id: string;

    @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency / 통화' })
    currency: ExchangeCurrencyCode;

    @ApiProperty({ description: 'Earn Toggle / 적립 활성화 여부' })
    isEarnEnabled: boolean;

    @ApiProperty({ description: 'Claim Toggle / 전환 활성화 여부' })
    isClaimEnabled: boolean;

    @ApiProperty({ description: 'Allow Negative Balance / 마이너스 잔액 허용 여부' })
    allowNegativeBalance: boolean;

    @ApiProperty({ description: 'Min Claim Amount / 최소 전환 금액' })
    minClaimAmount: string;

    @ApiProperty({ description: 'Max Daily Earn / 일일 최대 적립' })
    maxDailyEarnPerUser: string;

    @ApiProperty({ description: 'Expiration Days / 소멸 기간' })
    expirationDays: number;

    @ApiProperty({ required: false, description: 'Admin Note / 메모' })
    description: string | null;

    @ApiProperty({ description: 'Updated At / 수정 일시' })
    updatedAt: Date;
}

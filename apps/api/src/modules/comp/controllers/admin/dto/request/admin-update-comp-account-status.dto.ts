import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';
import { IsBoolean, IsEnum } from 'class-validator';

export class AdminUpdateCompAccountStatusDto {
    @ApiProperty({
        enum: ExchangeCurrencyCode,
        description: 'Currency code / 통화 코드',
    })
    @IsEnum(ExchangeCurrencyCode)
    currency: ExchangeCurrencyCode;

    @ApiProperty({
        type: Boolean,
        description: 'Freeze status / 동결 여부 (true: 정지, false: 활성)',
    })
    @IsBoolean()
    isFrozen: boolean;
}

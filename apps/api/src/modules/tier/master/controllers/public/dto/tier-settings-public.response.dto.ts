import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class TierSettingsPublicResponseDto {
    @ApiProperty()
    @IsBoolean()
    isPromotionEnabled: boolean;

    @ApiProperty()
    @IsBoolean()
    isDowngradeEnabled: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionResponseDto } from './promotion.response.dto';

export class VerifyPromotionCodeResponseDto {
    @ApiProperty({
        description: '유효성 여부',
        example: true,
    })
    isValid: boolean;

    @ApiPropertyOptional({
        description: '검증 실패 사유 (유효하지 않은 경우)',
        example: 'Minimum deposit amount is 10.00',
    })
    message?: string;

    @ApiPropertyOptional({
        description: '예상 보너스 금액 (유효한 경우)',
        example: '10.00',
        type: String,
    })
    estimatedBonusAmount?: string;

    @ApiPropertyOptional({
        description: '프로모션 상세 정보',
        type: PromotionResponseDto,
    })
    promotion?: PromotionResponseDto;
}

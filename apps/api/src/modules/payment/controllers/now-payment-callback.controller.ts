import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  UseFilters,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { NowPaymentCallbackResponseDto } from '../dtos/now-payment-callback.dto';
import { NowPaymentCallbackService } from '../application/now-payment-callback.service';
import { GuestOnly } from '../../../common/auth/decorators/roles.decorator';
import { ObjectUtil } from '../../../utils/object.util';

@ApiTags('NowPayment Callback')
@Controller('nowpayments')
@GuestOnly()
@UseFilters() // 글로벌 예외 필터 비활성화
export class NowPaymentCallbackController {
  constructor(
    private readonly nowPaymentCallbackService: NowPaymentCallbackService,
  ) { }

  @Post('/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'NowPayment 콜백 ' })
  async handleCallback(
    @Headers('x-nowpayments-sig') signature: string,
    @Body() callbackData: any, // any로 받고 내부에서 변환
    @Headers() allHeaders: Record<string, any>,
  ): Promise<NowPaymentCallbackResponseDto> {
    console.log('nowpayment callback controller');
    console.log('handleCallback', signature, callbackData, allHeaders);
    console.log('callbackData', callbackData);
    console.log('allHeaders', allHeaders);
    console.log('signature', signature);

    // 서명 검증
    if (!signature) {
      throw new BadRequestException('Signature header is missing');
    }

    // 원본 페이로드를 정렬된 JSON 문자열로 변환
    const payload = ObjectUtil.toSortedJsonString(callbackData);

    // 서명 검증 (IPN 시크릿 키 사용)
    if (!this.nowPaymentCallbackService.validateSignature(payload, signature)) {
      throw new UnauthorizedException('Invalid signature');
    }

    // 콜백 처리 (서비스에서 타입 구분)
    const result = await this.nowPaymentCallbackService.handleCallback(
      callbackData,
      allHeaders,
    );

    return result;
  }
}

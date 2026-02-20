import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ExchangeRateService } from '../application/exchange-rate.service';
import {
  ExchangeQuoteQueryDto,
  ExchangeQuoteItemDto,
  ConvertCurrencyQueryDto,
  ConvertCurrencyResponseDto,
} from '../dtos/exchange-rate.dto';
import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { Public } from 'src/common/auth/decorators/roles.decorator';
import { Throttle } from 'src/common/throttle/decorators/throttle.decorator';
import { ThrottleScope } from 'src/common/throttle/types/throttle.types';
import { PaginatedData, PaginatedResponseDto } from 'src/common/http/types';

@ApiTags('Public Exchange')
@ApiBearerAuth()
@Controller('exchange')
export class ExchangeController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  @Get('rates')
  @Public()
  @Throttle({
    limit: 30,
    ttl: 60,
    scope: ThrottleScope.IP,
  })
  @ApiOperation({
    summary: 'Get exchange rates (multiple) / 여러 환율 조회',
  })
  @ApiResponse({
    status: 200,
    description: 'Exchange rates fetched successfully / 환율 조회 성공',
    type: PaginatedResponseDto<ExchangeQuoteItemDto>,
  })
  async getRates(
    @Query() query: ExchangeQuoteQueryDto,
  ): Promise<PaginatedData<ExchangeQuoteItemDto>> {
    const { from, to } = query;

    const targets =
      to && to.length > 0
        ? to
        : (Object.values(ExchangeCurrencyCode) as ExchangeCurrencyCode[]);

    const items: ExchangeQuoteItemDto[] = [];
    const SCALE = 8; // 소수점 8자리

    for (const target of targets) {
      try {
        const rate = await this.exchangeRateService.getRate({
          fromCurrency: from,
          toCurrency: target,
        });

        items.push({
          from,
          to: target,
          rate: rate.toFixed(SCALE).toString(),
        });
      } catch {}
    }

    return { data: items, page: 1, limit: 10, total: items.length };
  }

  @Get('convert')
  @Public()
  @Throttle({
    limit: 30,
    ttl: 60,
    scope: ThrottleScope.IP,
  })
  @ApiOperation({
    summary: 'Convert currency (single) / 단일 통화 변환',
  })
  @ApiResponse({
    status: 200,
    description: 'Currency converted successfully / 통화 변환 성공',
    type: ConvertCurrencyResponseDto,
  })
  async convert(
    @Query() query: ConvertCurrencyQueryDto,
  ): Promise<ConvertCurrencyResponseDto> {
    const rate = await this.exchangeRateService.getRate({
      fromCurrency: query.from,
      toCurrency: query.to,
    });

    const amountDecimal = new Prisma.Decimal(query.amount);
    const converted = amountDecimal.mul(rate);

    const SCALE = 8; // 소수점 8자리

    return {
      from: query.from,
      to: query.to,
      amount: query.amount,
      rate: rate.toFixed(SCALE).toString(),
      convertedAmount: converted.toFixed(SCALE).toString(),
    };
  }
}

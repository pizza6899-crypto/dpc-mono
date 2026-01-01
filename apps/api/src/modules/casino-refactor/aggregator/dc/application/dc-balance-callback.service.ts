import { Injectable } from '@nestjs/common';
import {
  GetDcBalanceRequestDto,
  GetDcBalanceResponseDto,
} from '../dtos/callback.dto';
import { GetBalanceDcCallbackUseCase } from './use-cases/get-balance-dc-callback.use-case';

@Injectable()
export class DcBalanceCallbackService {
  constructor(
    private readonly getBalanceUseCase: GetBalanceDcCallbackUseCase,
  ) {}

  /**
   * Get Balance 콜백 (잔액 조회)
   */
  async getBalance(
    body: GetDcBalanceRequestDto,
  ): Promise<GetDcBalanceResponseDto> {
    return await this.getBalanceUseCase.execute(body);
  }
}


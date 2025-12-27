import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { NowPaymentApiService } from '../../modules/payment/infrastructure/now-payment-api.service';

@Injectable()
@Command({
  name: 'nowpayment:test',
  description: 'NowPayment API 서비스 테스트',
})
export class NowPaymentCommand extends CommandRunner {
  constructor(private readonly nowPaymentService: NowPaymentApiService) {
    super();
  }

  async run(): Promise<void> {
    console.log('🚀 NowPayment API 서비스 테스트 시작...\n');

    try {
      // 1. 토큰 상태 확인
      console.log('1. 토큰 상태 확인...');
      const tokenStatus = await this.nowPaymentService.getTokenStatus();
      console.log('토큰 상태:', tokenStatus);

      // 2. 토큰 무효화
      console.log('\n2. 토큰 무효화...');
      await this.nowPaymentService.invalidateToken();
      console.log('토큰이 무효화되었습니다.');

      // 3. 토큰 상태 재확인
      console.log('\n3. 토큰 상태 재확인...');
      const newTokenStatus = await this.nowPaymentService.getTokenStatus();
      console.log('새 토큰 상태:', newTokenStatus);

      // 4. 결제 생성 테스트 (실제 API 호출)
      // console.log('\n4. 결제 생성 테스트...');
      // const payment = await this.nowPaymentService.createInvoice(
      //   20,
      //   'KRW',
      //   // 'test-order-123',
      // );
      // console.log('결제 생성 결과:', payment);

      // 5. 결제 상태 조회 테스트
      // if (payment.id) {
      //   console.log('\n5. 결제 상태 조회 테스트...');
      //   const status = await this.nowPaymentService.getInvoiceStatus(
      //     payment.id,
      //   );
      //   console.log('결제 상태:', status);
      // }

      // // 6. 환율 조회 테스트
      // console.log('\n6. 환율 조회 테스트...');
      // const estimate = await this.nowPaymentService.getEstimate(
      //   10000,
      //   'KRW',
      //   'USD',
      // );
      // console.log('환율 조회 결과:', estimate);
      // console.log('\n✅ 모든 테스트가 완료되었습니다!');

      // // 7. 결제 생성 테스트
      // console.log('\n7. 결제 생성 테스트...');
      // const payment = await this.nowPaymentService.createPayment(
      //   3,
      //   'USD',
      //   'btc',
      // );
      // console.log('결제 생성 결과:', payment);

      // 페이아웃 테스트
      // console.log('\n8. 페이아웃 테스트...');
      // const payout = await this.nowPaymentService.createPayout({
      //   address: 'TE6g4TZo8XwsdURSy2L2QVRfZBYvLAgan6',
      //   fiat_amount: 10000,
      //   fiat_currency: 'KRW',
      //   crypto_currency: 'trx',
      // });
      // console.log('페이아웃 생성 결과:', payout);
    } catch (error) {
      console.error('❌ 테스트 실패:', error.message);
      console.error('상세 에러:', error);
    }
  }
}

// // src/modules/deposit/application/deposit.service.ts
// import { Injectable, Logger, HttpStatus } from '@nestjs/common';
// import { CreateDepositRequestDto } from '../dtos/create-deposit-request.dto';
// import { CreateDepositResponseDto } from '../dtos/create-deposit-response.dto';
// import { DepositMethodType, UserRoleType } from '@repo/database';
// import { ConcurrencyService } from '../../../common/concurrency/concurrency.service';
// import { UserValidationService } from 'src/common/user-validation/user-validation.service';
// import { ApiException } from 'src/common/http/exception/api.exception';
// import { MessageCode } from 'src/common/http/types';
// import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
// import { BankTransferDepositService } from './bank-transfer-deposit.service';
// import { CryptoDepositService } from './crypto-deposit.service';

// @Injectable()
// export class DepositService {
//   private readonly logger = new Logger(DepositService.name);

//   constructor(
//     private readonly concurrencyService: ConcurrencyService,
//     private readonly userValidationService: UserValidationService,
//     private readonly bankTransferDepositService: BankTransferDepositService,
//     private readonly cryptoDepositService: CryptoDepositService,
//   ) {}

//   async createDeposit(
//     userId: bigint,
//     createDepositRequest: CreateDepositRequestDto,
//     requestInfo: RequestClientInfo,
//   ): Promise<CreateDepositResponseDto> {
//     const { methodType } = createDepositRequest;

//     // 기본값 설정: methodType이 없으면 CRYPTO_WALLET으로 설정
//     const depositMethodType = methodType || DepositMethodType.CRYPTO_WALLET;

//     await this.userValidationService.validateUser(userId, {
//       requireActiveStatus: true,
//       requireEmailVerified: false,
//       // requireKycLevel: KycLevel.BASIC,
//       excludeRoles: [UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN],
//     });

//     // 사용자 레벨 동시성 제어로 중복 입금 요청 생성 방지
//     return await this.concurrencyService.withUserLock({
//       userId,
//       operation: 'deposit_creation',
//       options: {
//         ttl: 30,
//       },
//       callback: async () => {
//         try {
//           // methodType에 따라 적절한 서비스로 라우팅
//           switch (depositMethodType) {
//             case DepositMethodType.CRYPTO_WALLET:
//               return await this.cryptoDepositService.createDeposit(
//                 userId,
//                 createDepositRequest,
//                 requestInfo,
//               );
//             case DepositMethodType.BANK_TRANSFER:
//               return await this.bankTransferDepositService.createDeposit(
//                 userId,
//                 createDepositRequest,
//                 requestInfo,
//               );
//             default:
//               throw new ApiException(
//                 MessageCode.DEPOSIT_METHOD_NOT_AVAILABLE,
//                 HttpStatus.BAD_REQUEST,
//                 `Unsupported deposit method type: ${depositMethodType}`,
//               );
//           }
//         } catch (error) {
//           this.logger.error(
//             error,
//             `입금 요청 생성 실패 - User: ${userId}, Method: ${depositMethodType}`,
//           );
//           throw error;
//         }
//       },
//     });
//   }
// }


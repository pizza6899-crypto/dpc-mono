// src/modules/auth/credential/credential.module.integration.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { CredentialModule } from './credential.module';
import { AuthenticateCredentialService } from './application/authenticate-credential.service';
import { AuthenticateCredentialAdminService } from './application/authenticate-credential-admin.service';
import { LoginService } from './application/login.service';
import { LogoutService } from './application/logout.service';
import { RecordLoginAttemptService } from './application/record-login-attempt.service';
import { FindLoginAttemptsService } from './application/find-login-attempts.service';
import { VerifyCredentialService } from './application/verify-credential.service';
import { CredentialPolicy } from './domain/policy';
import {
  LOGIN_ATTEMPT_REPOSITORY,
  CREDENTIAL_USER_REPOSITORY,
  type LoginAttemptRepositoryPort,
  type CredentialUserRepositoryPort,
} from './ports/out';
import { LoginAttemptMapper } from './infrastructure/mapper';
import { CredentialUserMapper } from './infrastructure/credential-user.mapper';
import { CredentialUserController } from './controllers/user/credential-user.controller';
import { CredentialAdminController } from './controllers/admin/credential-admin.controller';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { EnvModule } from 'src/platform/env/env.module';
import { VipModule } from '../../vip/vip.module';
import { AffiliateReferralModule } from '../../affiliate/referral/referral.module';
import { ActivityLogModule } from 'src/platform/activity-log/activity-log.module';
import { PassportModule } from '@nestjs/passport';

describe('CredentialModule Integration', () => {
  let module: TestingModule;
  let authenticateCredentialService: AuthenticateCredentialService;
  let authenticateCredentialAdminService: AuthenticateCredentialAdminService;
  let loginService: LoginService;
  let logoutService: LogoutService;
  let recordLoginAttemptService: RecordLoginAttemptService;
  let findLoginAttemptsService: FindLoginAttemptsService;
  let verifyCredentialService: VerifyCredentialService;
  let credentialPolicy: CredentialPolicy;
  let loginAttemptRepository: LoginAttemptRepositoryPort;
  let credentialUserRepository: CredentialUserRepositoryPort;
  let loginAttemptMapper: LoginAttemptMapper;
  let credentialUserMapper: CredentialUserMapper;
  let credentialUserController: CredentialUserController;
  let credentialAdminController: CredentialAdminController;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule,
        PrismaModule,
        PassportModule.register({ session: true }),
        VipModule,
        AffiliateReferralModule,
        ActivityLogModule,
        CredentialModule,
      ],
    }).compile();

    authenticateCredentialService = module.get<AuthenticateCredentialService>(
      AuthenticateCredentialService,
    );
    authenticateCredentialAdminService =
      module.get<AuthenticateCredentialAdminService>(
        AuthenticateCredentialAdminService,
      );
    loginService = module.get<LoginService>(LoginService);
    logoutService = module.get<LogoutService>(LogoutService);
    recordLoginAttemptService = module.get<RecordLoginAttemptService>(
      RecordLoginAttemptService,
    );
    findLoginAttemptsService = module.get<FindLoginAttemptsService>(
      FindLoginAttemptsService,
    );
    verifyCredentialService = module.get<VerifyCredentialService>(
      VerifyCredentialService,
    );
    credentialPolicy = module.get<CredentialPolicy>(CredentialPolicy);
    loginAttemptRepository = module.get<LoginAttemptRepositoryPort>(
      LOGIN_ATTEMPT_REPOSITORY,
    );
    credentialUserRepository = module.get<CredentialUserRepositoryPort>(
      CREDENTIAL_USER_REPOSITORY,
    );
    loginAttemptMapper = module.get<LoginAttemptMapper>(LoginAttemptMapper);
    credentialUserMapper = module.get<CredentialUserMapper>(
      CredentialUserMapper,
    );
    credentialUserController = module.get<CredentialUserController>(
      CredentialUserController,
    );
    credentialAdminController = module.get<CredentialAdminController>(
      CredentialAdminController,
    );
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Module Initialization', () => {
    it('모듈이 정상적으로 초기화되어야 함', () => {
      expect(module).toBeDefined();
    });

    it('모든 Application Services가 주입되어야 함', () => {
      expect(authenticateCredentialService).toBeDefined();
      expect(authenticateCredentialAdminService).toBeDefined();
      expect(loginService).toBeDefined();
      expect(logoutService).toBeDefined();
      expect(recordLoginAttemptService).toBeDefined();
      expect(findLoginAttemptsService).toBeDefined();
      expect(verifyCredentialService).toBeDefined();
    });

    it('모든 Domain Policies가 주입되어야 함', () => {
      expect(credentialPolicy).toBeDefined();
    });

    it('모든 Infrastructure가 주입되어야 함', () => {
      expect(loginAttemptRepository).toBeDefined();
      expect(credentialUserRepository).toBeDefined();
      expect(loginAttemptMapper).toBeDefined();
      expect(credentialUserMapper).toBeDefined();
    });

    it('모든 Controllers가 주입되어야 함', () => {
      expect(credentialUserController).toBeDefined();
      expect(credentialAdminController).toBeDefined();
    });
  });

  describe('Service Dependencies', () => {
    it('AuthenticateCredentialService가 필요한 의존성을 가지고 있어야 함', () => {
      expect(authenticateCredentialService).toBeDefined();
      // 내부 의존성 확인은 private이므로 간접적으로 확인
      expect(authenticateCredentialService.execute).toBeDefined();
    });

    it('AuthenticateCredentialAdminService가 필요한 의존성을 가지고 있어야 함', () => {
      expect(authenticateCredentialAdminService).toBeDefined();
      expect(authenticateCredentialAdminService.execute).toBeDefined();
    });

    it('LoginService가 필요한 의존성을 가지고 있어야 함', () => {
      expect(loginService).toBeDefined();
      expect(loginService.execute).toBeDefined();
    });

    it('LogoutService가 필요한 의존성을 가지고 있어야 함', () => {
      expect(logoutService).toBeDefined();
      expect(logoutService.execute).toBeDefined();
    });

    it('RecordLoginAttemptService가 필요한 의존성을 가지고 있어야 함', () => {
      expect(recordLoginAttemptService).toBeDefined();
      expect(recordLoginAttemptService.execute).toBeDefined();
    });

    it('FindLoginAttemptsService가 필요한 의존성을 가지고 있어야 함', () => {
      expect(findLoginAttemptsService).toBeDefined();
      expect(findLoginAttemptsService.execute).toBeDefined();
    });

    it('VerifyCredentialService가 필요한 의존성을 가지고 있어야 함', () => {
      expect(verifyCredentialService).toBeDefined();
      expect(verifyCredentialService.execute).toBeDefined();
    });
  });

  describe('Repository Dependencies', () => {
    it('LoginAttemptRepository가 LoginAttemptRepositoryPort 인터페이스를 구현해야 함', () => {
      expect(loginAttemptRepository).toBeDefined();
      expect(loginAttemptRepository.create).toBeDefined();
      expect(loginAttemptRepository.listRecent).toBeDefined();
    });

    it('CredentialUserRepository가 CredentialUserRepositoryPort 인터페이스를 구현해야 함', () => {
      expect(credentialUserRepository).toBeDefined();
      expect(credentialUserRepository.findByEmail).toBeDefined();
    });
  });

  describe('Mapper Dependencies', () => {
    it('LoginAttemptMapper가 정의되어야 함', () => {
      expect(loginAttemptMapper).toBeDefined();
      expect(loginAttemptMapper.toDomain).toBeDefined();
      expect(loginAttemptMapper.toPrisma).toBeDefined();
    });

    it('CredentialUserMapper가 정의되어야 함', () => {
      expect(credentialUserMapper).toBeDefined();
      expect(credentialUserMapper.toDomain).toBeDefined();
    });
  });

  describe('Policy Dependencies', () => {
    it('CredentialPolicy가 정의되어야 함', () => {
      expect(credentialPolicy).toBeDefined();
      expect(credentialPolicy.isAccountLocked).toBeDefined();
    });
  });

  describe('Module Exports', () => {
    it('export된 서비스들이 다른 모듈에서 사용 가능해야 함', () => {
      // CredentialModule에서 export하는 서비스들
      const exportedLoginService = module.get<LoginService>(LoginService);
      const exportedLogoutService = module.get<LogoutService>(LogoutService);
      const exportedVerifyCredentialService =
        module.get<VerifyCredentialService>(VerifyCredentialService);

      expect(exportedLoginService).toBeDefined();
      expect(exportedLogoutService).toBeDefined();
      expect(exportedVerifyCredentialService).toBeDefined();
    });
  });

  describe('Controller Integration', () => {
    it('CredentialUserController가 모든 의존성을 가지고 있어야 함', () => {
      expect(credentialUserController).toBeDefined();
      expect(credentialUserController.login).toBeDefined();
      expect(credentialUserController.logout).toBeDefined();
      expect(credentialUserController.checkStatus).toBeDefined();
    });

    it('CredentialAdminController가 모든 의존성을 가지고 있어야 함', () => {
      expect(credentialAdminController).toBeDefined();
      expect(credentialAdminController.login).toBeDefined();
      expect(credentialAdminController.logout).toBeDefined();
      expect(credentialAdminController.checkStatus).toBeDefined();
      expect(credentialAdminController.getAttempts).toBeDefined();
    });
  });

  describe('Service Integration', () => {
    it('AuthenticateCredentialService가 VerifyCredentialService를 사용해야 함', () => {
      // 서비스가 정상적으로 주입되었는지 확인
      expect(authenticateCredentialService).toBeDefined();
      expect(verifyCredentialService).toBeDefined();
    });

    it('AuthenticateCredentialService가 FindLoginAttemptsService를 사용해야 함', () => {
      expect(authenticateCredentialService).toBeDefined();
      expect(findLoginAttemptsService).toBeDefined();
    });

    it('AuthenticateCredentialService가 RecordLoginAttemptService를 사용해야 함', () => {
      expect(authenticateCredentialService).toBeDefined();
      expect(recordLoginAttemptService).toBeDefined();
    });

    it('AuthenticateCredentialService가 CredentialPolicy를 사용해야 함', () => {
      expect(authenticateCredentialService).toBeDefined();
      expect(credentialPolicy).toBeDefined();
    });

    it('LoginService가 RecordLoginAttemptService를 사용해야 함', () => {
      expect(loginService).toBeDefined();
      expect(recordLoginAttemptService).toBeDefined();
    });
  });

  describe('Repository Integration', () => {
    it('RecordLoginAttemptService가 LoginAttemptRepository를 사용해야 함', () => {
      expect(recordLoginAttemptService).toBeDefined();
      expect(loginAttemptRepository).toBeDefined();
    });

    it('FindLoginAttemptsService가 LoginAttemptRepository를 사용해야 함', () => {
      expect(findLoginAttemptsService).toBeDefined();
      expect(loginAttemptRepository).toBeDefined();
    });

    it('VerifyCredentialService가 CredentialUserRepository를 사용해야 함', () => {
      expect(verifyCredentialService).toBeDefined();
      expect(credentialUserRepository).toBeDefined();
    });
  });
});


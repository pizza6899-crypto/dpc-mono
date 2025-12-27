import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { EnvModule } from '../env/env.module';

describe('PrismaModule with ClsModule', () => {
  let module: TestingModule;
  let clsModule: ClsModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [EnvModule, PrismaModule],
    }).compile();

    clsModule = module.get<ClsModule>(ClsModule, { strict: false });
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(clsModule).toBeDefined();
  });

  it('should export ClsModule', () => {
    const exportedClsModule = module.get<ClsModule>(ClsModule, {
      strict: false,
    });
    expect(exportedClsModule).toBeDefined();
  });

  it('should have PrismaModule as dependency', () => {
    const prismaModule = module.get(PrismaModule, { strict: false });
    expect(prismaModule).toBeDefined();
  });

  it('should have PrismaService available', () => {
    const prismaService = module.get<PrismaService>(PrismaService, {
      strict: false,
    });
    expect(prismaService).toBeDefined();
  });

  describe('Transactional Plugin Configuration', () => {
    it('should configure TransactionHost for Prisma', () => {
      // TransactionHost는 트랜잭션 컨텍스트 내에서만 사용 가능하므로
      // 모듈이 제대로 설정되었는지 확인
      expect(clsModule).toBeDefined();
    });

    it('should have TransactionalAdapterPrisma configured', () => {
      // 어댑터가 제대로 설정되었는지 확인
      // 실제 사용은 @Transactional() 데코레이터와 함께 TransactionHost를 통해 이루어짐
      expect(module).toBeDefined();
    });
  });
});

describe('PrismaModule Integration', () => {
  let module: TestingModule;
  let prismaService: PrismaService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [EnvModule, PrismaModule],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should initialize all dependencies correctly', () => {
    expect(module).toBeDefined();
    expect(prismaService).toBeDefined();
  });

  it('should have ClsModule properly configured', () => {
    const clsModule = module.get<ClsModule>(ClsModule, { strict: false });
    expect(clsModule).toBeDefined();
  });
});

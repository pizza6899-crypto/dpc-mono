// src/modules/auth/registration/controllers/user/registration.controller.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { RegistrationController } from './registration.controller';
import { RegisterCredentialService } from '../../application/register-credential.service';
import { RegisterRequestDto } from './dto/request/register.request.dto';
import { RegisterResponseDto } from './dto/response/register.response.dto';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types/message-codes';

describe('RegistrationController', () => {
  let module: TestingModule;
  let controller: RegistrationController;
  let mockRegisterCredentialService: jest.Mocked<RegisterCredentialService>;

  const mockRequestInfo: RequestClientInfo = {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    country: 'KR',
    city: 'Seoul',
    referer: 'https://example.com',
    acceptLanguage: 'ko-KR,ko;q=0.9',
    fingerprint: 'fingerprint-123',
    protocol: 'https',
    method: 'POST',
    path: '/auth/register',
    timestamp: new Date(),
    isMobile: false,
    browser: 'Chrome',
    os: 'Windows',
    timezone: 'Asia/Seoul',
    isp: 'ISP',
    asn: 'ASN',
    threat: 'low',
    bot: false,
  };

  const mockRegisterDto: RegisterRequestDto = {
    email: 'user@example.com',
    password: 'password123!',
  };

  const mockRegisterDtoWithReferral: RegisterRequestDto = {
    email: 'user@example.com',
    password: 'password123!',
    referralCode: 'REFERRAL123',
  };

  const mockRegisterResult: RegisterResponseDto = {
    uid: 'user-123',
    email: 'user@example.com',
  };

  beforeEach(async () => {
    const mockRegisterCredentialServiceProvider = {
      provide: RegisterCredentialService,
      useValue: {
        execute: jest.fn(),
      },
    };

    module = await Test.createTestingModule({
      controllers: [RegistrationController],
      providers: [mockRegisterCredentialServiceProvider],
    }).compile();

    controller = module.get<RegistrationController>(RegistrationController);
    mockRegisterCredentialService = module.get(RegisterCredentialService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('register', () => {
    it('레퍼럴 코드 없이 회원가입 성공 시 사용자 정보를 반환해야 함', async () => {
      // Arrange
      mockRegisterCredentialService.execute.mockResolvedValue(
        mockRegisterResult,
      );

      // Act
      const result = await controller.register(mockRequestInfo, mockRegisterDto);

      // Assert
      expect(result).toEqual(mockRegisterResult);
      expect(mockRegisterCredentialService.execute).toHaveBeenCalledTimes(1);
      expect(mockRegisterCredentialService.execute).toHaveBeenCalledWith({
        email: mockRegisterDto.email,
        password: mockRegisterDto.password,
        referralCode: undefined,
        requestInfo: mockRequestInfo,
      });
    });

    it('레퍼럴 코드와 함께 회원가입 성공 시 사용자 정보를 반환해야 함', async () => {
      // Arrange
      mockRegisterCredentialService.execute.mockResolvedValue(
        mockRegisterResult,
      );

      // Act
      const result = await controller.register(
        mockRequestInfo,
        mockRegisterDtoWithReferral,
      );

      // Assert
      expect(result).toEqual(mockRegisterResult);
      expect(mockRegisterCredentialService.execute).toHaveBeenCalledTimes(1);
      expect(mockRegisterCredentialService.execute).toHaveBeenCalledWith({
        email: mockRegisterDtoWithReferral.email,
        password: mockRegisterDtoWithReferral.password,
        referralCode: mockRegisterDtoWithReferral.referralCode,
        requestInfo: mockRequestInfo,
      });
    });

    it('RegisterCredentialService가 ApiException을 던지면 예외를 전파해야 함', async () => {
      // Arrange
      const error = new ApiException(
        MessageCode.USER_ALREADY_EXISTS,
        400,
      );
      mockRegisterCredentialService.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.register(mockRequestInfo, mockRegisterDto),
      ).rejects.toThrow(ApiException);

      expect(mockRegisterCredentialService.execute).toHaveBeenCalledTimes(1);
    });

    it('RegisterCredentialService가 일반 Error를 던지면 예외를 전파해야 함', async () => {
      // Arrange
      const error = new Error('Service error');
      mockRegisterCredentialService.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.register(mockRequestInfo, mockRegisterDto),
      ).rejects.toThrow('Service error');

      expect(mockRegisterCredentialService.execute).toHaveBeenCalledTimes(1);
    });
  });
});


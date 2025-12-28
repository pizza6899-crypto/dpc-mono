import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { ProfileResponseDto } from '../dtos/profile.dto';
import { UpdateLanguageDto } from '../dtos/update-locale.dto';
import { LocaleResponseDto } from '../dtos/locale-response.dto';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types/message-codes';
import { CountryUtil } from '../../../utils/country.util';
import { UpdateCountryDto } from '../dtos/update-profile.dto';
import { toLanguageEnum } from 'src/utils/language.util';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ACTIVITY_LOG) private readonly activityLog: ActivityLogPort,
  ) {}

  async getMyProfile(
    userId: string,
    requestInfo: RequestClientInfo,
  ): Promise<ProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new ApiException(MessageCode.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    // 활동 로그 기록
    await this.activityLog.logSuccess(
      {
        userId: user.id,
        activityType: ActivityType.PROFILE_VIEW,
        description: '내 프로필 조회',
      },
      requestInfo,
    );

    return {
      id: user.id,
      email: user.email ?? 'unknown',
      language: user.language ?? 'en',
    };
  }

  async updateUserLocale(
    userId: string,
    updateLocaleDto: UpdateLanguageDto,
    requestInfo: RequestClientInfo,
  ): Promise<LocaleResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiException(MessageCode.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    // 로케일 업데이트
    await this.prisma.user.update({
      where: { id: userId },
      data: { language: toLanguageEnum(updateLocaleDto.language) },
    });

    // 활동 로그 기록
    await this.activityLog.logSuccess(
      {
        userId,
        activityType: ActivityType.PROFILE_UPDATE,
        description: `언어를 ${updateLocaleDto.language}로 변경`,
        metadata: {
          previousLanguage: user.language,
          newLanguage: updateLocaleDto.language,
        },
      },
      requestInfo,
    );

    return {
      language: updateLocaleDto.language,
    };
  }

  /**
   * 사용자 프로필 업데이트 (국가 설정 포함)
   */
  async updateCountry(
    userId: string,
    updateProfileDto: UpdateCountryDto,
    requestInfo: RequestClientInfo,
  ): Promise<void> {
    const { country, timezone } = requestInfo;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiException(MessageCode.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (user.country) {
      throw new ApiException(
        MessageCode.USER_COUNTRY_ALREADY_SET,
        HttpStatus.BAD_REQUEST,
      );
    }

    const updateData: any = {};

    if (country) {
      const countryConfig = CountryUtil.getCountryConfig({
        countryCode: country,
        timezone,
      });

      updateData.country = country.toUpperCase();
      updateData.timezone = countryConfig.timezone;
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      await this.activityLog.logSuccess(
        {
          userId,
          activityType: ActivityType.USER_COUNTRY_UPDATE,
          description: 'Country updated successfully',
          metadata: {
            updatedFields: Object.keys(updateData),
            countryCode: country,
          },
        },
        requestInfo,
      );
    }
  }
}

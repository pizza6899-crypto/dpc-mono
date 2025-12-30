import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types/message-codes';
import { HttpStatus } from '@nestjs/common';
import { toLanguageEnum } from 'src/utils/language.util';

@Injectable()
export class PromotionTranslationService {
  private readonly logger = new Logger(PromotionTranslationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 프로모션 다국어 번역 생성/업데이트
   */
  async upsertPromotionTranslation(
    promotionId: number,
    language: string,
    name: string,
    description?: string | null,
  ) {
    // 프로모션 존재 여부 확인
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      throw new ApiException(
        MessageCode.PROMOTION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'Promotion not found',
      );
    }

    // 언어 코드 유효성 검사
    if (!language || language.trim().length === 0) {
      throw new ApiException(
        MessageCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Language code is required',
      );
    }

    // 이름 유효성 검사
    if (!name || name.trim().length === 0) {
      throw new ApiException(
        MessageCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Promotion name is required',
      );
    }

    try {
      // 번역 생성/업데이트
      const translation = await this.prisma.promotionTranslation.upsert({
        where: {
          promotionId_language: {
            promotionId,
            language: toLanguageEnum(language),
          },
        },
        update: {
          name: name.trim(),
          description: description?.trim() ?? null,
        },
        create: {
          promotionId,
          language: toLanguageEnum(language),
          name: name.trim(),
          description: description?.trim() ?? null,
        },
      });

      this.logger.log(
        `프로모션 번역 업데이트: promotionId=${promotionId}, language=${language}`,
      );

      return translation;
    } catch (error) {
      this.logger.error(
        `프로모션 번역 업데이트 실패: promotionId=${promotionId}, language=${language}`,
        error,
      );
      throw new ApiException(
        MessageCode.DB_QUERY_ERROR,
        HttpStatus.BAD_REQUEST,
        'Failed to create or update promotion translation',
      );
    }
  }

  /**
   * 프로모션 번역 목록 조회
   */
  async getPromotionTranslations(promotionId: number) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      throw new ApiException(
        MessageCode.PROMOTION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'Promotion not found',
      );
    }

    return await this.prisma.promotionTranslation.findMany({
      where: { promotionId },
      orderBy: { language: 'asc' },
    });
  }

  /**
   * 특정 언어의 프로모션 번역 조회
   */
  async getPromotionTranslationByLanguage(
    promotionId: number,
    language: string,
  ) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      throw new ApiException(
        MessageCode.PROMOTION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'Promotion not found',
      );
    }

    const translation = await this.prisma.promotionTranslation.findUnique({
      where: {
        promotionId_language: {
          promotionId,
          language: toLanguageEnum(language),
        },
      },
    });

    if (!translation) {
      throw new ApiException(
        MessageCode.PROMOTION_TRANSLATION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        `Promotion translation not found for language: ${language}`,
      );
    }

    return translation;
  }

  /**
   * 프로모션 번역 삭제
   */
  async deletePromotionTranslation(
    promotionId: number,
    language: string,
  ): Promise<void> {
    // 프로모션 존재 여부 확인
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      throw new ApiException(
        MessageCode.PROMOTION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'Promotion not found',
      );
    }

    const translation = await this.prisma.promotionTranslation.findUnique({
      where: {
        promotionId_language: {
          promotionId,
          language: toLanguageEnum(language),
        },
      },
    });

    if (!translation) {
      throw new ApiException(
        MessageCode.PROMOTION_TRANSLATION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        `Promotion translation not found for language: ${language}`,
      );
    }

    try {
      await this.prisma.promotionTranslation.delete({
        where: {
          promotionId_language: {
            promotionId,
            language: toLanguageEnum(language),
          },
        },
      });

      this.logger.log(
        `프로모션 번역 삭제: promotionId=${promotionId}, language=${language}`,
      );
    } catch (error) {
      this.logger.error(
        `프로모션 번역 삭제 실패: promotionId=${promotionId}, language=${language}`,
        error,
      );
      throw new ApiException(
        MessageCode.DB_QUERY_ERROR,
        HttpStatus.BAD_REQUEST,
        'Failed to delete promotion translation',
      );
    }
  }
}

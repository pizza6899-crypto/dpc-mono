// src/modules/user/application/list-users.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { USER_REPOSITORY } from '../ports/out/user.repository.token';
import type {
  UserRepositoryPort,
  FindUsersParams,
} from '../ports/out/user.repository.port';
import type { PaginatedData } from 'src/common/http/types';
import type { UserRoleType, UserStatus } from '@prisma/client';
import { User } from '../domain';

interface ListUsersServiceParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'email';
  sortOrder?: 'asc' | 'desc';
  email?: string;
  role?: UserRoleType;
  status?: UserStatus;
  startDate?: string;
  endDate?: string;
}

interface ListUsersServiceResult extends PaginatedData<User> {}

/**
 * 사용자 목록 조회 Use Case
 *
 * 관리자가 등록된 사용자 목록을 조회합니다.
 * 페이징, 필터링, 정렬 기능을 지원합니다.
 */
@Injectable()
export class ListUsersService {
  private readonly logger = new Logger(ListUsersService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(
    params: ListUsersServiceParams,
  ): Promise<ListUsersServiceResult> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      email,
      role,
      status,
      startDate,
      endDate,
    } = params;

    try {
      // Repository 파라미터 구성
      const findParams: FindUsersParams = {
        page,
        limit,
        sortBy,
        sortOrder,
        email,
        role,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      };

      // 사용자 목록 조회
      const result = await this.userRepository.findMany(findParams);

      return {
        data: result.users,
        page,
        limit,
        total: result.total,
      };
    } catch (error) {
      throw error;
    }
  }
}


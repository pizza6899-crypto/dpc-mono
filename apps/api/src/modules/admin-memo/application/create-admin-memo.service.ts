import { Inject, Injectable } from '@nestjs/common';
import {
  ADMIN_MEMO_REPOSITORY,
  type AdminMemoRepositoryPort,
  type CreateAdminMemoParams,
} from '../ports/out';
import { AdminMemo } from '../domain';

@Injectable()
export class CreateAdminMemoService {
  constructor(
    @Inject(ADMIN_MEMO_REPOSITORY)
    private readonly adminMemoRepository: AdminMemoRepositoryPort,
  ) {}

  async execute(params: CreateAdminMemoParams): Promise<AdminMemo> {
    // 1. 도메인 엔티티를 통해 생성 가능 여부(Validation) 확인 및 정제
    const memo = AdminMemo.create({
      adminId: params.adminId,
      content: params.content,
      target: params.target,
    });

    // 2. 저장 (Repository에 위임)
    return await this.adminMemoRepository.create({
      adminId: memo.adminId,
      content: memo.content,
      target: memo.target,
    });
  }
}

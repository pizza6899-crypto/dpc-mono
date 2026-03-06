import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
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
    ) { }

    @Transactional()
    async execute(params: CreateAdminMemoParams): Promise<AdminMemo | null> {
        // 도메인 엔티티를 통해 생성 가능 여부(Validation) 확인
        // 만약 예외 처리가 아닌 null 반환을 원하신다면 try-catch로 감쌀 수 있습니다.
        try {
            const memo = AdminMemo.create({
                adminId: params.adminId,
                content: params.content,
                depositId: params.depositId,
            });

            return await this.adminMemoRepository.create({
                ...params,
                content: memo.content, // 정제된(trimmed) 내용 사용
            });
        } catch (error) {
            // 내용이 비어있는 경우 등은 조용히 null 반환 (요청하신 패턴 유지)
            return null;
        }
    }
}

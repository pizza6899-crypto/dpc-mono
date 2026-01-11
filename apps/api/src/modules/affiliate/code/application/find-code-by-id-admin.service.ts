import { Inject, Injectable } from '@nestjs/common';
import {
    AffiliateCode,
    AffiliateCodeNotFoundException,
} from '../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';

@Injectable()
export class FindCodeByIdAdminService {
    constructor(
        @Inject(AFFILIATE_CODE_REPOSITORY)
        private readonly repository: AffiliateCodeRepositoryPort,
    ) { }

    async execute(id: bigint): Promise<AffiliateCode> {
        const code = await this.repository.findByIdAdmin(id);

        if (!code) {
            throw new AffiliateCodeNotFoundException(id);
        }

        return code;
    }
}

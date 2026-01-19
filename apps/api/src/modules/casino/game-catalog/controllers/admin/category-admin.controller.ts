import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Admin } from 'src/common/auth/decorators/roles.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { FindCategoriesService } from '../../application/find-categories.service';

@ApiTags('Admin Casino Category')
@Controller('admin/casino/categories')
@Admin()
export class CategoryAdminController {
    constructor(private readonly findCategoriesService: FindCategoriesService) { }

    @Get()
    @ApiOperation({ summary: 'List all categories' })
    @AuditLog({ type: LogType.ACTIVITY, category: 'CASINO', action: 'CATEGORY_LIST' })
    async list(@Query('isActive') isActive?: boolean) {
        const categories = await this.findCategoriesService.execute({ isActive });
        return categories.map((cat) => ({
            id: cat.id?.toString(),
            code: cat.code,
            type: cat.type,
            isActive: cat.isActive,
            sortOrder: cat.sortOrder,
            translations: cat.translations,
        }));
    }
}

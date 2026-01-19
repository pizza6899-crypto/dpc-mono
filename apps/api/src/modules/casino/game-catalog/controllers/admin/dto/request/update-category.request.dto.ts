import { PartialType, PickType } from '@nestjs/swagger';
import { CreateCategoryAdminRequestDto } from './create-category.request.dto';

export class UpdateCategoryAdminRequestDto extends PartialType(
    PickType(CreateCategoryAdminRequestDto, [
        'iconFileId',
        'bannerFileId',
        'sortOrder',
        'isActive',
        'translations',
    ] as const),
) { }

import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto, PaginationDto } from 'src/common/http/types/pagination.types';
import { WageringRequirementAdminResponseDto } from './wagering-requirement-admin.response.dto';

export class PaginatedWageringRequirementAdminResponseDto extends PaginatedResponseDto<WageringRequirementAdminResponseDto> {
    @ApiProperty({
        type: [WageringRequirementAdminResponseDto],
        description: 'Wagering Requirement List (롤링 조건 목록)',
    })
    declare data: WageringRequirementAdminResponseDto[];

    @ApiProperty({
        type: PaginationDto,
        description: 'Pagination Info (페이지네이션 정보)',
    })
    declare pagination: PaginationDto;
}

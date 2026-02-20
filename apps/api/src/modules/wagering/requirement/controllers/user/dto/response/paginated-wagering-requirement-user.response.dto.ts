import { ApiProperty } from '@nestjs/swagger';
import {
  PaginatedResponseDto,
  PaginationDto,
} from 'src/common/http/types/pagination.types';
import { WageringRequirementUserResponseDto } from './wagering-requirement-user.response.dto';

export class PaginatedWageringRequirementUserResponseDto extends PaginatedResponseDto<WageringRequirementUserResponseDto> {
  @ApiProperty({
    type: [WageringRequirementUserResponseDto],
    description: 'Wagering Requirement List (롤링 조건 목록)',
  })
  declare data: WageringRequirementUserResponseDto[];

  @ApiProperty({
    type: PaginationDto,
    description: 'Pagination Info (페이지네이션 정보)',
  })
  declare pagination: PaginationDto;
}

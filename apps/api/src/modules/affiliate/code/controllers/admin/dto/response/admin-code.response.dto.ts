import { ApiProperty } from '@nestjs/swagger';
import { AdminCodeListItemDto } from './admin-code-list.response.dto';

export class AdminCodeResponseDto extends AdminCodeListItemDto {
    // Currently reused from list item, but can be extended if details has more fields.
    // For now, list item seems to have all comprehensive details suitable for admin.
}

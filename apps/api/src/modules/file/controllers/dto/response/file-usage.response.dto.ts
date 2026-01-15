import { ApiProperty } from '@nestjs/swagger';
import { FileUsageType } from '../../../domain';

export class FileUsageResponseDto {
    @ApiProperty({ example: '1' })
    id: string;

    @ApiProperty({ example: '1' })
    fileId: string;

    @ApiProperty({ enum: FileUsageType, example: FileUsageType.USER_PROFILE })
    usageType: FileUsageType;

    @ApiProperty({ example: '123' })
    usageId: string;

    @ApiProperty({ example: 0 })
    order: number;

    @ApiProperty()
    createdAt: Date;
}

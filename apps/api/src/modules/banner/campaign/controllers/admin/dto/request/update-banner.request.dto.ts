import { PartialType } from '@nestjs/swagger';
import { CreateBannerAdminRequestDto } from './create-banner.request.dto';

export class UpdateBannerAdminRequestDto extends PartialType(CreateBannerAdminRequestDto) {}

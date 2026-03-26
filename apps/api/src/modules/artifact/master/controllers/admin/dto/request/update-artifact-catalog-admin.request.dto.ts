import { PartialType } from '@nestjs/swagger';
import { CreateArtifactCatalogAdminRequestDto } from './create-artifact-catalog-admin.request.dto';

/**
 * [Artifact] 유물 마스터 데이터 수정 요청 DTO
 */
export class UpdateArtifactCatalogAdminRequestDto extends PartialType(CreateArtifactCatalogAdminRequestDto) {}

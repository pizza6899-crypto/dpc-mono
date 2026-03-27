import { Module } from '@nestjs/common';

import { UserArtifactDrawController } from './controllers/user/user-artifact-draw.controller';
import { DrawArtifactService } from './application/draw-artifact.service';

/**
 * [Artifact Support] 유물 뽑기 서브 모듈
 */
@Module({
  imports: [],
  controllers: [UserArtifactDrawController],
  providers: [DrawArtifactService],
})
export class ArtifactDrawModule { }

// src/platform/user-validation/user-validation.module.ts
import { Module } from '@nestjs/common';
import { UserValidationService } from './user-validation.service';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UserValidationService],
  exports: [UserValidationService],
})
export class UserValidationModule {}

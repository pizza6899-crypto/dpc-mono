import { Injectable } from '@nestjs/common';
import { CredentialUser } from '../domain';

@Injectable()
export class CredentialUserMapper {
  toDomain(prismaModel: any): CredentialUser {
    return CredentialUser.create({
      id: prismaModel.id,
      email: prismaModel.email,
      passwordHash: prismaModel.passwordHash,
      status: prismaModel.status,
      role: prismaModel.role,
    });
  }
}

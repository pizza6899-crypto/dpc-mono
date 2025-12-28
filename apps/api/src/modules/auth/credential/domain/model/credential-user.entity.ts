import { UserStatus, UserRoleType } from '@repo/database';

export class CredentialUser {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string | null,
    public readonly status: UserStatus,
    public readonly role: UserRoleType,
  ) {}

  static create(params: {
    id: string;
    email: string;
    passwordHash: string | null;
    status: UserStatus;
    role: UserRoleType;
  }): CredentialUser {
    return new CredentialUser(
      params.id,
      params.email,
      params.passwordHash,
      params.status,
      params.role,
    );
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  isAdmin(): boolean {
    return (
      this.role === UserRoleType.ADMIN || this.role === UserRoleType.SUPER_ADMIN
    );
  }
}

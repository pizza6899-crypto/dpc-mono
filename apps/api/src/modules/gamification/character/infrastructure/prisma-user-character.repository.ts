import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { Prisma } from '@prisma/client';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UserCharacterRepositoryPort } from '../ports/user-character.repository.port';
import { UserCharacter } from '../domain/user-character.entity';
import { UserCharacterMapper } from './user-character.mapper';

@Injectable()
export class PrismaUserCharacterRepository implements UserCharacterRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: UserCharacterMapper,
  ) { }

  async findByUserId(userId: bigint): Promise<UserCharacter | null> {
    const record = await this.tx.userCharacter.findUnique({
      where: { userId },
    });

    if (!record) {
      return null;
    }

    return this.mapper.toDomain(record);
  }

  async save(character: UserCharacter): Promise<void> {
    const persistenceData = this.mapper.toPersistence(character);

    // update시 userId는 수정하지 않으므로 분리
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId, ...updateData } = persistenceData;

    await this.tx.userCharacter.upsert({
      where: { userId: character.userId },
      create: persistenceData as Prisma.UserCharacterUncheckedCreateInput,
      update: updateData as Prisma.UserCharacterUncheckedUpdateInput,
    });
  }
}

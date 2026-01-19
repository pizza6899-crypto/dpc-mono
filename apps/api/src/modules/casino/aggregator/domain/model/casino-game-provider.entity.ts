
export class CasinoGameProvider {
    private constructor(
        public readonly id: bigint | null,
        public readonly aggregatorId: bigint,
        public readonly name: string,
        public readonly code: string,
        public readonly groupCode: string,
        public readonly imageUrl: string | null,
        public readonly isActive: boolean,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    static create(params: {
        id?: bigint;
        aggregatorId: bigint;
        name: string;
        code: string;
        groupCode: string;
        imageUrl?: string | null;
        isActive?: boolean;
        createdAt?: Date;
        updatedAt?: Date;
    }): CasinoGameProvider {
        return new CasinoGameProvider(
            params.id ?? null,
            params.aggregatorId,
            params.name,
            params.code,
            params.groupCode,
            params.imageUrl ?? null,
            params.isActive ?? true,
            params.createdAt ?? new Date(),
            params.updatedAt ?? new Date(),
        );
    }

    update(params: {
        name?: string;
        imageUrl?: string | null;
        isActive?: boolean;
    }): CasinoGameProvider {
        return new CasinoGameProvider(
            this.id,
            this.aggregatorId,
            params.name ?? this.name,
            this.code,
            this.groupCode,
            params.imageUrl !== undefined ? params.imageUrl : this.imageUrl,
            params.isActive !== undefined ? params.isActive : this.isActive,
            this.createdAt,
            new Date(),
        );
    }
}

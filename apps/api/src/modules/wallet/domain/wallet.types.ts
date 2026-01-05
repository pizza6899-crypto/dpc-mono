// src/modules/wallet/domain/wallet.types.ts
export enum BalanceType {
    MAIN = 'main',
    BONUS = 'bonus',
    TOTAL = 'total', // 메인 우선, 부족하면 보너스에서 차감
}

export enum UpdateOperation {
    ADD = 'add',
    SUBTRACT = 'subtract',
}

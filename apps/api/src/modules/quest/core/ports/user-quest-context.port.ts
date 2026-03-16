export const USER_QUEST_CONTEXT_PORT_TOKEN = Symbol('USER_QUEST_CONTEXT_PORT_TOKEN');

export interface UserQuestEntryContext {
  totalDepositCount: number;
  totalWithdrawalCount: number;
  hasWithdrawalHistory: boolean;
}

export interface UserQuestContextPort {
  getEntryContext(userId: bigint): Promise<UserQuestEntryContext>;
}

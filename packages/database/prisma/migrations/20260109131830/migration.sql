-- AlterTable
CREATE SEQUENCE bonusdetail_id_seq;
ALTER TABLE "BonusDetail" ALTER COLUMN "id" SET DEFAULT nextval('bonusdetail_id_seq');
ALTER SEQUENCE bonusdetail_id_seq OWNED BY "BonusDetail"."id";

-- AlterTable
CREATE SEQUENCE gamebet_id_seq;
ALTER TABLE "GameBet" ALTER COLUMN "id" SET DEFAULT nextval('gamebet_id_seq');
ALTER SEQUENCE gamebet_id_seq OWNED BY "GameBet"."id";

-- AlterTable
CREATE SEQUENCE gameround_id_seq;
ALTER TABLE "GameRound" ALTER COLUMN "id" SET DEFAULT nextval('gameround_id_seq');
ALTER SEQUENCE gameround_id_seq OWNED BY "GameRound"."id";

-- AlterTable
CREATE SEQUENCE gamewin_id_seq;
ALTER TABLE "GameWin" ALTER COLUMN "id" SET DEFAULT nextval('gamewin_id_seq');
ALTER SEQUENCE gamewin_id_seq OWNED BY "GameWin"."id";

-- AlterTable
CREATE SEQUENCE transaction_id_seq;
ALTER TABLE "Transaction" ALTER COLUMN "id" SET DEFAULT nextval('transaction_id_seq');
ALTER SEQUENCE transaction_id_seq OWNED BY "Transaction"."id";

-- AlterTable
CREATE SEQUENCE transactionbalancedetail_id_seq;
ALTER TABLE "TransactionBalanceDetail" ALTER COLUMN "id" SET DEFAULT nextval('transactionbalancedetail_id_seq');
ALTER SEQUENCE transactionbalancedetail_id_seq OWNED BY "TransactionBalanceDetail"."id";

-- AlterTable
CREATE SEQUENCE withdrawdetail_id_seq;
ALTER TABLE "WithdrawDetail" ALTER COLUMN "id" SET DEFAULT nextval('withdrawdetail_id_seq');
ALTER SEQUENCE withdrawdetail_id_seq OWNED BY "WithdrawDetail"."id";

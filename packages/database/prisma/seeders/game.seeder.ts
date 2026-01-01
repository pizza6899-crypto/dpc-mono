import {
  GameAggregatorType,
  GameCategory,
  GameProvider,
  Language,
  PrismaClient,
} from '../../src';
import { init } from '@paralleldrive/cuid2';

const generateUid = init();

export async function seedLobbyGames(prisma: PrismaClient) {
  console.log('🎮 로비 게임 시딩을 시작합니다...');

  // 1. 에볼루션 로비 게임
  const evolutionLobby = await prisma.game.upsert({
    where: {
      aggregatorType_provider_aggregatorGameId: {
        aggregatorType: GameAggregatorType.WHITECLIFF,
        provider: GameProvider.EVOLUTION,
        aggregatorGameId: 0,
      },
    },
    update: {
      isVisibleToUser: true, // 로비는 항상 visible
      isEnabled: true,
    },
    create: {
      uid: generateUid(),
      aggregatorType: GameAggregatorType.WHITECLIFF,
      provider: GameProvider.EVOLUTION,
      category: GameCategory.LIVE_CASINO,
      aggregatorGameId: 0,
      isEnabled: true,
      isVisibleToUser: true, // 로비는 항상 visible
      translations: {
        create: [
          {
            uid: generateUid(),
            language: Language.KO,
            providerName: '에볼루션',
            categoryName: '라이브 카지노',
            gameName: '에볼루션 로비',
          },
          {
            uid: generateUid(),
            language: Language.EN,
            providerName: 'Evolution',
            categoryName: 'Live Casino',
            gameName: 'Evolution Lobby',
          },
          {
            uid: generateUid(),
            language: Language.JA,
            providerName: 'エボリューション',
            categoryName: 'ライブカジノ',
            gameName: 'エボリューションロビー',
          },
        ],
      },
    },
  });

  console.log(`✅ 에볼루션 로비 게임 생성 완료 (ID: ${evolutionLobby.id})`);

  // 2. 프라그매틱 플레이 라이브 로비 게임
  const pragmaticPlayLiveLobby = await prisma.game.upsert({
    where: {
      aggregatorType_provider_aggregatorGameId: {
        aggregatorType: GameAggregatorType.WHITECLIFF,
        provider: GameProvider.PRAGMATIC_PLAY_LIVE,
        aggregatorGameId: 0,
      },
    },
    update: {
      isVisibleToUser: true, // 로비는 항상 visible
      isEnabled: true,
    },
    create: {
      uid: generateUid(),
      aggregatorType: GameAggregatorType.WHITECLIFF,
      provider: GameProvider.PRAGMATIC_PLAY_LIVE,
      category: GameCategory.LIVE_CASINO,
      aggregatorGameId: 0,
      isEnabled: true,
      isVisibleToUser: true, // 로비는 항상 visible
      translations: {
        create: [
          {
            uid: generateUid(),
            language: Language.KO,
            providerName: '프라그매틱 플레이 라이브',
            categoryName: '라이브 카지노',
            gameName: '프라그매틱 플레이 라이브 로비',
          },
          {
            uid: generateUid(),
            language: Language.EN,
            providerName: 'Pragmatic Play Live',
            categoryName: 'Live Casino',
            gameName: 'Pragmatic Play Live Lobby',
          },
          {
            uid: generateUid(),
            language: Language.JA,
            providerName: 'プラグマティックプレイライブ',
            categoryName: 'ライブカジノ',
            gameName: 'プラグマティックプレイライブロビー',
          },
        ],
      },
    },
  });

  console.log(
    `✅ 프라그매틱 플레이 라이브 로비 게임 생성 완료 (ID: ${pragmaticPlayLiveLobby.id})`,
  );

  console.log('✅ 로비 게임 시딩이 완료되었습니다.');
}
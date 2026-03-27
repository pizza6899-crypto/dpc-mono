import { PrismaClient } from '@prisma/client';
import type { PolicyConfiguration } from '../../src/modules/user-intelligence/policy/domain/policy-config.types';

/**
 * 초기 시스템 기본 스코어링 정책 설정
 * (도메인 코드에서 분리하여 시딩 시점에 결정함)
 */
const INITIAL_POLICY_CONFIG: PolicyConfiguration = {
    valueIndex: {
        totalNetLossUnitAmount: 15,
        recent30dNetLossUnitAmount: 10,
        stabilityMinCV: 0.3,
        stabilityMaxCV: 2.0,
    },
    depositAmount: {
        d30UnitAmount: 25,
        d180UnitAmount: 150,
        lifetimeMinusUnitAmount: 150,
        stabilityMinCV: 0.3,
        stabilityMaxCV: 1.6,
    },
    depositCount: {
        d30ScorePerDay: 3,
        d90ScorePerDay: 1,
        intervalMinCV: 0.4,
        intervalMaxCV: 0.8,
    },
    rolling: {
        contributionUnit: 0.03,
        bonusDependencyUnit: 2,
    },
    behavior: {
        scorePerActiveDay: 2,
        scorePerSessionMinute: 1,
        scorePerCategory: 4,
        scorePerPost: 3,
        scorePerComment: 1,
        scorePerChat: 0.5,
        scorePerMissionDay: 0.5,
        missionRateUnit: 0.3,
    },
    riskPromotion: {
        bonusDepositRatioThreshold: 60,
        bonusExcessScorePerPercent: 3,
        rollingThreshold: 20,
        rollingExcessScorePerPercent: 1.5,
    },
    riskTechnical: {
        ipOverlapScore: 100,
        fingerprintOverlapScore: 50,
        inconsistencyScore: 30,
        fingerprintChange2Score: 30,
        fingerprintChange3Score: 70,
    },
    riskBehavior: {
        scorePerLowValueReferral: 20,
        scorePerMaliciousPost: 10,
    },
};

export async function seedUserIntelligencePolicy(prisma: PrismaClient) {
    console.log('🧠 사용자 지능형 평가 정책(UserIntelligencePolicy) 시딩을 시작합니다...');

    const policyData = {
        config: INITIAL_POLICY_CONFIG,
        adminNote: 'Initial system default scoring policy.',
        isActive: true,
    };

    // ID 1로 기본 정책 생성 (이미 있으면 건너뜀)
    await prisma.userIntelligencePolicy.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            config: policyData.config as any,
            adminNote: policyData.adminNote,
            isActive: policyData.isActive,
        },
    });

    console.log('✅ 사용자 지능형 평가 정책 시딩이 완료되었습니다.');
}

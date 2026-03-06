import { ChannelType, Language } from '@prisma/client';
import { NOTIFICATION_EVENTS } from 'src/modules/notification/common';
import { TemplateSeed } from '../types';

export const userTemplates: TemplateSeed[] = [
    {
        name: '회원가입 축하 알림 (Email)',
        event: NOTIFICATION_EVENTS.USER_REGISTERED,
        channel: ChannelType.EMAIL,
        variables: ['email'],
        translations: {
            create: [
                {
                    locale: Language.KO,
                    titleTemplate: '환영합니다, {{email}}님!',
                    bodyTemplate: '회원가입을 진심으로 축하드립니다. 다양한 서비스를 이용해 보세요.',
                },
                {
                    locale: Language.EN,
                    titleTemplate: 'Welcome, {{email}}!',
                    bodyTemplate: 'Thank you for joining us. Enjoy our services.',
                },
                {
                    locale: Language.JA,
                    titleTemplate: 'こんにちは、{{email}}さん!',
                    bodyTemplate: '会員登録을 心からお慶비申し上げます。様々なサービスをご活用ください。',
                },
            ],
        },
    },
    {
        name: '회원가입 축하 알림 (Inbox)',
        event: NOTIFICATION_EVENTS.USER_REGISTERED,
        channel: ChannelType.INBOX,
        variables: [],
        translations: {
            create: [
                {
                    locale: Language.KO,
                    titleTemplate: '가입을 환영합니다!',
                    bodyTemplate: 'DPC 서비스 가입을 진심으로 축하드립니다. 지금 바로 다양한 혜택을 확인해 보세요!',
                    actionUriTemplate: '/',
                },
                {
                    locale: Language.EN,
                    titleTemplate: 'Welcome to DPC!',
                    bodyTemplate: 'Thank you for joining DPC. Check out various benefits right now!',
                    actionUriTemplate: '/',
                },
                {
                    locale: Language.JA,
                    titleTemplate: '加入をお祝い申し上げます!',
                    bodyTemplate: 'DPC サービスへの加入를 心よりお祝い申し上げます。今すぐ様々な特典をチェックしてください!',
                    actionUriTemplate: '/',
                },
            ],
        },
    },
    {
        name: '휴대폰 번호 인증 (SMS)',
        event: NOTIFICATION_EVENTS.PHONE_VERIFICATION_CODE,
        channel: ChannelType.SMS,
        variables: ['code'],
        translations: {
            create: [
                {
                    locale: Language.KO,
                    titleTemplate: '휴대폰 인증번호',
                    bodyTemplate: '인증번호 [{{code}}]를 입력해 주세요.',
                },
                {
                    locale: Language.EN,
                    titleTemplate: 'Phone Verification',
                    bodyTemplate: 'Please enter your verification code: [{{code}}]',
                },
                {
                    locale: Language.JA,
                    titleTemplate: '携帯電話番号認証',
                    bodyTemplate: '認証번호 [{{code}}] 를 입력해 주세요.',
                },
            ],
        },
    },
];

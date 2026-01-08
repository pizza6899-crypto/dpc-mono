/**
 * AsyncAPI 데코레이터 래퍼
 * 
 * 운영 환경(production)에서는 nestjs-asyncapi 라이브러리를 로드하지 않고
 * 아무런 동작도 하지 않는 빈 데코레이터를 제공합니다.
 * 이는 nestjs-asyncapi가 의존하는 @asyncapi/generator가 요구하는 
 * ts-node 등 무거운 패키지들을 운영 이미지에서 제외하기 위함입니다.
 */

// 타입 정의를 위해 import type 사용 (실제 런타임 코드에는 포함되지 않음)
import type { AsyncApiPub as OriginalPub, AsyncApiSub as OriginalSub } from 'nestjs-asyncapi';

let PubDecorator: typeof OriginalPub = () => (target: any, key?: string | symbol, descriptor?: any) => { };
let SubDecorator: typeof OriginalSub = () => (target: any, key?: string | symbol, descriptor?: any) => { };

// 운영 환경이 아닐 때만 실제 라이브러리를 동적으로 로드
if (process.env.NODE_ENV !== 'production') {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const asyncApi = require('nestjs-asyncapi');
        PubDecorator = asyncApi.AsyncApiPub;
        SubDecorator = asyncApi.AsyncApiSub;
    } catch (error) {
        console.warn('[AsyncApiWrapper] Failed to load nestjs-asyncapi library. Falling back to dummy decorators.');
    }
}

export const AsyncApiPub = PubDecorator;
export const AsyncApiSub = SubDecorator;

import { Test, TestingModule } from '@nestjs/testing';
import { SnowflakeService } from './snowflake.service';
import { EnvService } from '../env/env.service';
import { RedisService } from 'src/infrastructure/redis/redis.service';

describe('SnowflakeService', () => {
    let service: SnowflakeService;
    let envService: EnvService;
    let redisService: RedisService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SnowflakeService,
                {
                    provide: EnvService,
                    useValue: {
                        pm2InstanceNumber: '0',
                    },
                },
                {
                    provide: RedisService,
                    useValue: {
                        setLock: jest.fn().mockResolvedValue(true),
                        del: jest.fn().mockResolvedValue(true),
                        getClient: jest.fn().mockReturnValue({
                            expire: jest.fn().mockResolvedValue(true),
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<SnowflakeService>(SnowflakeService);
        envService = module.get<EnvService>(EnvService);
        redisService = module.get<RedisService>(RedisService);

        // onModuleInit을 호출하여 Node ID 할당 시뮬레이션
        await service.onModuleInit();
    });

    afterEach(async () => {
        await service.onModuleDestroy();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('nextId', () => {
        it('should generate a valid bigint ID', () => {
            const id = service.nextId();
            expect(typeof id).toBe('bigint');
            expect(id).toBeGreaterThan(0n);
        });

        it('should generate unique IDs', () => {
            const ids = new Set<bigint>();
            const count = 10000;

            for (let i = 0; i < count; i++) {
                const id = service.nextId();
                ids.add(id);
            }

            // 모든 ID가 고유해야 함
            expect(ids.size).toBe(count);
        });

        it('should generate increasing IDs', () => {
            const id1 = service.nextId();
            const id2 = service.nextId();
            const id3 = service.nextId();

            expect(id2).toBeGreaterThan(id1);
            expect(id3).toBeGreaterThan(id2);
        });

        it('should handle rapid generation within same millisecond', () => {
            const ids: bigint[] = [];
            const count = 100;

            // 동일 밀리초 내에서 빠르게 생성
            for (let i = 0; i < count; i++) {
                ids.push(service.nextId());
            }

            // 모든 ID가 고유해야 함
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(count);

            // 모든 ID가 증가해야 함
            for (let i = 1; i < ids.length; i++) {
                expect(ids[i]).toBeGreaterThan(ids[i - 1]);
            }
        });
    });

    describe('parse', () => {
        it('should correctly parse a generated ID', () => {
            const id = service.nextId();
            const parsed = service.parse(id);

            expect(parsed.timestamp).toBeGreaterThan(0n);
            expect(parsed.nodeId).toBe(0n); // pm2InstanceNumber가 '0'이므로
            expect(parsed.sequence).toBeGreaterThanOrEqual(0n);
            expect(parsed.sequence).toBeLessThanOrEqual(4095n);
            expect(parsed.date).toBeInstanceOf(Date);
        });

        it('should extract correct node ID', () => {
            const id = service.nextId();
            const parsed = service.parse(id);

            // EnvService mock에서 pm2InstanceNumber가 '0'이므로 nodeId는 0
            expect(parsed.nodeId).toBe(0n);
        });

        it('should extract valid timestamp', () => {
            const beforeGeneration = Date.now();
            const id = service.nextId();
            const afterGeneration = Date.now();

            const parsed = service.parse(id);
            const parsedTime = parsed.date.getTime();

            // 생성 시간이 테스트 실행 시간 범위 내에 있어야 함
            expect(parsedTime).toBeGreaterThanOrEqual(beforeGeneration);
            expect(parsedTime).toBeLessThanOrEqual(afterGeneration + 1000); // 1초 여유
        });
    });

    describe('Node ID handling', () => {
        it('should use PM2 instance number as node ID', async () => {
            const testModule = await Test.createTestingModule({
                providers: [
                    SnowflakeService,
                    {
                        provide: EnvService,
                        useValue: {
                            pm2InstanceNumber: '5',
                        },
                    },
                    {
                        provide: RedisService,
                        useValue: {
                            setLock: jest.fn().mockResolvedValue(true),
                            del: jest.fn().mockResolvedValue(true),
                            getClient: jest.fn().mockReturnValue({
                                expire: jest.fn().mockResolvedValue(true),
                            }),
                        },
                    },
                ],
            }).compile();

            const testService = testModule.get<SnowflakeService>(SnowflakeService);
            await testService.onModuleInit();
            const id = testService.nextId();
            const parsed = testService.parse(id);

            expect(parsed.nodeId).toBe(5n);
            await testService.onModuleDestroy();
        });

        it('should mask node ID to 10 bits (max 1023)', async () => {
            const testModule = await Test.createTestingModule({
                providers: [
                    SnowflakeService,
                    {
                        provide: EnvService,
                        useValue: {
                            pm2InstanceNumber: '2048', // 10 bits를 초과하는 값
                        },
                    },
                    {
                        provide: RedisService,
                        useValue: {
                            setLock: jest.fn().mockResolvedValue(true),
                            del: jest.fn().mockResolvedValue(true),
                            getClient: jest.fn().mockReturnValue({
                                expire: jest.fn().mockResolvedValue(true),
                            }),
                        },
                    },
                ],
            }).compile();

            const testService = testModule.get<SnowflakeService>(SnowflakeService);
            await testService.onModuleInit();
            const id = testService.nextId();
            const parsed = testService.parse(id);

            // 2048 & 0x3ff = 0 (비트 마스킹 결과)
            expect(parsed.nodeId).toBeLessThanOrEqual(1023n);
            await testService.onModuleDestroy();
        });
    });

    describe('Sequence handling', () => {
        it('should increment sequence within same millisecond', () => {
            const ids: bigint[] = [];

            // 동일 밀리초 내에서 여러 ID 생성
            for (let i = 0; i < 10; i++) {
                ids.push(service.nextId());
            }

            const parsed = ids.map((id) => service.parse(id));

            // 첫 번째와 마지막 ID가 같은 밀리초에 생성되었다면
            if (parsed[0].timestamp === parsed[parsed.length - 1].timestamp) {
                // 시퀀스가 증가해야 함
                for (let i = 1; i < parsed.length; i++) {
                    if (parsed[i].timestamp === parsed[i - 1].timestamp) {
                        expect(parsed[i].sequence).toBeGreaterThan(parsed[i - 1].sequence);
                    }
                }
            }
        });
    });

    describe('Clock Drift handling', () => {
        let mockNow: jest.SpyInstance;

        beforeEach(() => {
            mockNow = jest.spyOn(Date, 'now');
        });

        afterEach(() => {
            mockNow.mockRestore();
        });

        it('should wait and recover if clock moves backwards by less than 5ms', () => {
            const baseTime = Date.now();
            mockNow.mockReturnValue(baseTime);
            service.nextId(); // lastTimestamp = baseTime

            // 시계를 2ms 뒤로 돌림
            mockNow.mockReturnValue(baseTime - 2);

            // 다음 호출 시 waitNextMillis가 작동하여 baseTime 이후의 값을 반환해야 함
            // 여기서는 waitNextMillis 내부에서 다시 Date.now()를 호출하므로 순차적인 반환값을 설정
            mockNow
                .mockReturnValueOnce(baseTime - 2) // nextId() 진입 시점
                .mockReturnValueOnce(baseTime + 1); // waitNextMillis() 내부 시점

            const id = service.nextId();
            const parsed = service.parse(id);

            expect(parsed.timestamp).toBe(BigInt(baseTime + 1));
        });

        it('should throw error if clock moves backwards by 5ms or more', () => {
            const baseTime = Date.now();
            mockNow.mockReturnValue(baseTime);
            service.nextId(); // lastTimestamp = baseTime

            // 시계를 5ms 뒤로 돌림
            mockNow.mockReturnValue(baseTime - 5);

            expect(() => service.nextId()).toThrow('Clock moved backwards');
        });
    });
});

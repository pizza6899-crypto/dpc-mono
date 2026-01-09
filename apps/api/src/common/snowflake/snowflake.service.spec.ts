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

    describe('generate', () => {
        it('should generate a valid bigint ID', () => {
            const id = service.generate(new Date());
            expect(typeof id).toBe('bigint');
            expect(id).toBeGreaterThan(0n);
        });

        it('should generate unique IDs', () => {
            const ids = new Set<bigint>();
            const count = 10000;

            for (let i = 0; i < count; i++) {
                const id = service.generate(new Date());
                ids.add(id);
            }

            // 모든 ID가 고유해야 함
            expect(ids.size).toBe(count);
        });

        it('should generate increasing IDs', () => {
            const id1 = service.generate(new Date());
            const id2 = service.generate(new Date());
            const id3 = service.generate(new Date());

            expect(id2).toBeGreaterThan(id1);
            expect(id3).toBeGreaterThan(id2);
        });

        it('should handle rapid generation within same millisecond', () => {
            const ids: bigint[] = [];
            const count = 100;

            // 동일 밀리초 내에서 빠르게 생성
            const now = new Date();
            for (let i = 0; i < count; i++) {
                ids.push(service.generate(now));
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
            const id = service.generate(new Date());
            const parsed = service.parse(id);

            expect(parsed.timestamp).toBeGreaterThan(0n);
            expect(parsed.nodeId).toBe(0n); // pm2InstanceNumber가 '0'이므로
            expect(parsed.sequence).toBeGreaterThanOrEqual(0n);
            expect(parsed.sequence).toBeLessThanOrEqual(4095n);
            expect(parsed.date).toBeInstanceOf(Date);
        });

        it('should extract correct node ID', () => {
            const id = service.generate(new Date());
            const parsed = service.parse(id);

            // EnvService mock에서 pm2InstanceNumber가 '0'이므로 nodeId는 0
            expect(parsed.nodeId).toBe(0n);
        });

        it('should extract valid timestamp', () => {
            const beforeGeneration = Date.now();
            const id = service.generate(new Date());
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
            const id = testService.generate(new Date());
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
            const id = testService.generate(new Date());
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
                ids.push(service.generate(new Date()));
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



    describe('generate', () => {
        it('should generate ID with specific timestamp', () => {
            const targetTime = new Date('2027-01-01T00:00:00Z');
            const id = service.generate(targetTime);
            const parsed = service.parse(id);

            expect(parsed.date.getTime()).toBe(targetTime.getTime());
        });

        it('should accept Date, bigint, and number as input', () => {
            const targetDate = new Date('2027-01-01T00:00:00Z');
            const targetBigInt = BigInt(targetDate.getTime());
            const targetNumber = targetDate.getTime();

            const id1 = service.generate(targetDate);
            const id2 = service.generate(targetBigInt);
            const id3 = service.generate(targetNumber);

            const parsed1 = service.parse(id1);
            const parsed2 = service.parse(id2);
            const parsed3 = service.parse(id3);

            expect(parsed1.date.getTime()).toBe(targetDate.getTime());
            expect(parsed2.date.getTime()).toBe(targetDate.getTime());
            expect(parsed3.date.getTime()).toBe(targetDate.getTime());
        });

        it('should handle past timestamp after current timestamp generation', () => {
            service.generate(new Date()); // 현재 시간으로 생성
            const pastTime = new Date('2026-06-01T00:00:00Z'); // EPOCH(2026-01-01) 이후 시간
            const id = service.generate(pastTime);

            expect(id).toBeGreaterThan(0n);
            const parsed = service.parse(id);
            expect(parsed.date.getTime()).toBe(pastTime.getTime());
        });

        it('should generate unique IDs for multiple calls with same timestamp', () => {
            const fixedTime = new Date('2027-01-01T00:00:00Z');
            const ids = new Set<bigint>();

            for (let i = 0; i < 100; i++) {
                ids.add(service.generate(fixedTime));
            }

            expect(ids.size).toBe(100); // 모두 고유해야 함
        });

        it('should increment sequence for same fixed timestamp', () => {
            const fixedTime = new Date('2027-01-01T00:00:00Z');
            const id1 = service.generate(fixedTime);
            const id2 = service.generate(fixedTime);
            const id3 = service.generate(fixedTime);

            const parsed1 = service.parse(id1);
            const parsed2 = service.parse(id2);
            const parsed3 = service.parse(id3);

            expect(parsed1.sequence).toBe(0n);
            expect(parsed2.sequence).toBe(1n);
            expect(parsed3.sequence).toBe(2n);
        });

        it('should throw error when sequence overflows for fixed timestamp', () => {
            const fixedTime = new Date('2027-01-01T00:00:00Z');

            // 4096번 생성 (시퀀스 0-4095)
            for (let i = 0; i < 4096; i++) {
                service.generate(fixedTime);
            }

            // 4097번째 호출 시 에러 발생해야 함
            expect(() => service.generate(fixedTime)).toThrow(
                'Sequence overflow for fixed timestamp'
            );
        });

        it('should reset sequence when timestamp changes', () => {
            const time1 = new Date('2027-01-01T00:00:00.000Z');
            const time2 = new Date('2027-01-01T00:00:00.001Z'); // 1ms 차이

            service.generate(time1); // sequence = 0
            service.generate(time1); // sequence = 1

            const id = service.generate(time2); // 새 타임스탬프, sequence = 0
            const parsed = service.parse(id);

            expect(parsed.sequence).toBe(0n);
        });
    });
});

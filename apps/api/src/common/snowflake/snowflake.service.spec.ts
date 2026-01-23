import { Test, TestingModule } from '@nestjs/testing';
import { SnowflakeService } from './snowflake.service';
import { NodeIdentityService } from '../node-identity/node-identity.service';

describe('SnowflakeService', () => {
    let service: SnowflakeService;
    let nodeIdentityService: NodeIdentityService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SnowflakeService,
                {
                    provide: NodeIdentityService,
                    useValue: {
                        getNodeId: jest.fn().mockReturnValue(1),
                    },
                },
            ],
        }).compile();

        service = module.get<SnowflakeService>(SnowflakeService);
        nodeIdentityService = module.get<NodeIdentityService>(NodeIdentityService);
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
            expect(parsed.nodeId).toBe(1n); // mocked as 1
            expect(parsed.sequence).toBeGreaterThanOrEqual(0n);
            expect(parsed.sequence).toBeLessThanOrEqual(4095n);
            expect(parsed.date).toBeInstanceOf(Date);
        });

        it('should extract correct node ID', () => {
            const id = service.generate(new Date());
            const parsed = service.parse(id);

            // mocked as 1
            expect(parsed.nodeId).toBe(1n);
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
        it('should use NodeIdentityService for node ID', async () => {
            const testModule = await Test.createTestingModule({
                providers: [
                    SnowflakeService,
                    {
                        provide: NodeIdentityService,
                        useValue: {
                            getNodeId: jest.fn().mockReturnValue(5),
                        },
                    },
                ],
            }).compile();

            const testService = testModule.get<SnowflakeService>(SnowflakeService);
            const id = testService.generate(new Date());
            const parsed = testService.parse(id);

            expect(parsed.nodeId).toBe(5n);
        });

        it('should handle max node ID (1023)', async () => {
            const testModule = await Test.createTestingModule({
                providers: [
                    SnowflakeService,
                    {
                        provide: NodeIdentityService,
                        useValue: {
                            getNodeId: jest.fn().mockReturnValue(1023),
                        },
                    },
                ],
            }).compile();

            const testService = testModule.get<SnowflakeService>(SnowflakeService);
            const id = testService.generate(new Date());
            const parsed = testService.parse(id);

            expect(parsed.nodeId).toBe(1023n);
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

        it('should throw SnowflakeClockBackwardsException when clock moves backwards', () => {
            const now = new Date();
            service.generate(now); // Set lastTimestamp

            // Try to generate ID for past timestamp
            const pastTime = new Date(now.getTime() - 1000); // 1 second ago

            expect(() => service.generate(pastTime)).toThrow('Clock moved backwards');
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

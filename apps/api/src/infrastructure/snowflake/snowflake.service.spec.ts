import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { SnowflakeService } from './snowflake.service';
import { NodeIdentityService } from 'src/infrastructure/node-identity/node-identity.service';
import { SnowflakeClockBackwardsException } from './snowflake.exception';

describe('SnowflakeService', () => {
  let service: SnowflakeService;
  let nodeIdentityService: NodeIdentityService;

  const MOCK_NODE_ID = 1;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnowflakeService,
        {
          provide: NodeIdentityService,
          useValue: {
            getNodeId: jest.fn().mockReturnValue(MOCK_NODE_ID),
          },
        },
      ],
    }).compile();

    service = module.get<SnowflakeService>(SnowflakeService);
    nodeIdentityService = module.get<NodeIdentityService>(NodeIdentityService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Internal Generation (System Time)', () => {
    it('should return GeneratedSnowflake object with id and timestamp', () => {
      const result = service.generate();

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.id).toBe('bigint');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should sync ID timestamp with returned timestamp object', () => {
      const { id, timestamp } = service.generate();
      const parsed = service.parse(id);

      // 허용 오차 1ms 이내 (계산 과정에서의 미세 차이)
      const diff = Math.abs(parsed.date.getTime() - timestamp.getTime());
      expect(diff).toBeLessThanOrEqual(1);
      expect(parsed.isExternal).toBe(false);
    });

    it('should generate increasing IDs for sequential calls', () => {
      const { id: id1 } = service.generate();
      const { id: id2 } = service.generate();
      expect(id2).toBeGreaterThan(id1);
    });

    it('should throw ClockBackwardsException for large skew (>= 2000ms)', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      // 1. Initial generation
      service.generate();

      // 2. Simulate large clock rollback
      const pastTime = now - 2500;
      jest.spyOn(Date, 'now').mockReturnValue(pastTime);

      expect(() => service.generate()).toThrow(
        SnowflakeClockBackwardsException,
      );
    });

    it('should wait and recover for small clock skew (< 2000ms)', () => {
      let currentTime = 100000;
      const dateSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => currentTime);

      // 1. Set lastTimestamp = 100000
      service.generate();

      // 2. Simulate clock rollback to 99500 (500ms skew)
      const skewTime = 99500;
      currentTime = skewTime;

      // 3. Simulate time passing using a generator or simpler mock
      // We ensure Date.now() keeps increasing to eventually break the loop
      dateSpy.mockImplementation(() => {
        currentTime += 2000; // Jump enough to pass wait loop immediately in next call
        return currentTime;
      });

      // 4. generate
      const { id, timestamp } = service.generate();

      // The timestamp result comes from the waitNextMillis -> Date.now()
      // So it should be > 100000.
      // If currentTime joined at 99500 + 2000 = 101500
      expect(timestamp.getTime()).toBeGreaterThan(100000);

      const parsed = service.parse(id);
      expect(parsed.timestamp).toBe(BigInt(timestamp.getTime()));
    });
  });

  describe('External Generation (Injected Time)', () => {
    it('should use provided time exactly', () => {
      const targetTime = new Date('2025-01-01T00:00:00Z');
      const { id, timestamp } = service.generate(targetTime);

      expect(timestamp.getTime()).toBe(targetTime.getTime());

      const parsed = service.parse(id);
      expect(parsed.date.getTime()).toBe(targetTime.getTime());
    });

    it('should set isExternal=true and use External Node ID range', () => {
      const { id } = service.generate(Date.now());
      const parsed = service.parse(id);

      expect(parsed.isExternal).toBe(true);

      // Note: service.parse() XORs the external offset back to return the original node ID
      // So parsed.nodeId should be the original internal node ID (1)
      expect(parsed.nodeId).toBe(BigInt(MOCK_NODE_ID));

      // To verify it actually used the External Node ID bit, we check the raw ID manualy
      // External Node ID = (1 & 0x1ff) | 512 = 513 = 10 0000 0001 (binary)
      // Node ID is at bits 12~21.
      const NODE_ID_SHIFT = 12n;
      const NODE_ID_MASK = 0x3ffn;
      const rawNodeId = (id >> NODE_ID_SHIFT) & NODE_ID_MASK;
      expect(rawNodeId).toBe(BigInt(MOCK_NODE_ID | 512));
    });

    it('should allow generating past IDs (Historical Data)', () => {
      // First generate current
      service.generate();

      // Then generate very old ID
      const past = new Date('2020-01-01');
      const { id, timestamp } = service.generate(past);

      expect(timestamp.getTime()).toBe(past.getTime());
      // Should not throw clock backwards exception
    });

    it('should handle "Interleaved" events (Out-of-order arrival)', () => {
      // Edge Case: T1 -> T2 -> T1 sequence
      const t1 = BigInt(new Date('2025-01-01T10:00:00.000Z').getTime());
      const t2 = BigInt(new Date('2025-01-01T10:00:00.001Z').getTime()); // +1ms

      const r1 = service.generate(t1); // T1, Seq 0
      const r2 = service.generate(t2); // T2, Seq 0
      const r3 = service.generate(t1); // T1 again! Should be Seq 1

      expect(r1.timestamp.getTime()).toBe(Number(t1));
      expect(r3.timestamp.getTime()).toBe(Number(t1));

      const p1 = service.parse(r1.id);
      const p3 = service.parse(r3.id);

      expect(p1.sequence).toBe(0n);
      expect(p3.sequence).toBe(1n); // Successfully remembered sequence for T1
      expect(r1.id).not.toBe(r3.id); // Collision avoided
    });
  });

  describe('Edge Cases & Limits', () => {
    it('should handle Type Mixing (Date vs number vs bigint)', () => {
      const date = new Date();
      const num = date.getTime();
      const big = BigInt(num);

      const r1 = service.generate(date);
      const r2 = service.generate(num);
      const r3 = service.generate(big);

      expect(r1.timestamp.getTime()).toBe(num);
      expect(r2.timestamp.getTime()).toBe(num);
      expect(r3.timestamp.getTime()).toBe(num);
    });

    it('should separate Node IDs for Internal vs External to prevent collision', () => {
      const now = Date.now();

      // Mock Date.now() for internal
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const internal = service.generate();
      const external = service.generate(now);

      // Directly check raw node ID from generated ID
      const NODE_ID_SHIFT = 12n;
      const NODE_ID_MASK = 0x3ffn;

      const internalNodeId = (internal.id >> NODE_ID_SHIFT) & NODE_ID_MASK;
      const externalNodeId = (external.id >> NODE_ID_SHIFT) & NODE_ID_MASK;

      expect(internalNodeId).not.toBe(externalNodeId);
      expect(externalNodeId).toBe(internalNodeId | 512n);
    });
  });
});

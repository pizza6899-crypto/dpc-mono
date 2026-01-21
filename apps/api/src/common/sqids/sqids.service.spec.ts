import { Test, TestingModule } from '@nestjs/testing';
import { SqidsService } from './sqids.service';
import { EnvService } from '../env/env.service';
import { SqidsPrefix } from './sqids.constants';
import { InvalidSqidFormatException, InvalidSqidIdException } from './sqids.exception';

describe('SqidsService', () => {
    let service: SqidsService;

    const mockEnvService = {
        sqids: {
            alphabet: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            minLength: 8,
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SqidsService,
                {
                    provide: EnvService,
                    useValue: mockEnvService,
                },
            ],
        }).compile();

        service = module.get<SqidsService>(SqidsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('encode', () => {
        it('should encode a single number', () => {
            const id = 12345;
            const encoded = service.encode(id);
            expect(encoded).toBeDefined();
            expect(encoded.length).toBeGreaterThanOrEqual(8);
        });

        it('should encode a single bigint', () => {
            const id = 12345n;
            const encoded = service.encode(id);
            expect(encoded).toBeDefined();
            expect(encoded.length).toBeGreaterThanOrEqual(8);
        });

        it('should encode large bigint', () => {
            const id = 9007199254740991n + 100n; // Safe integer + 100
            const encoded = service.encode(id);
            expect(encoded).toBeDefined();
            expect(service.decode(encoded)).toBe(id);
        });

        it('should prepend prefix if provided', () => {
            const id = 1;
            const prefix = SqidsPrefix.USER;
            const encoded = service.encode(id, prefix);
            expect(encoded.startsWith(prefix)).toBe(true);
        });

        it('should throw error for zero ID', () => {
            expect(() => service.encode(0)).toThrow(InvalidSqidIdException);
        });

        it('should throw error for negative ID', () => {
            expect(() => service.encode(-1)).toThrow(InvalidSqidIdException);
        });
    });

    describe('decode', () => {
        it('should decode a valid sqid back to bigint', () => {
            const id = 12345n;
            const encoded = service.encode(id);
            const decoded = service.decode(encoded);
            expect(decoded).toBe(id);
        });

        it('should decode with prefix correctly', () => {
            const id = 99999n;
            const prefix = SqidsPrefix.DEPOSIT;
            const encoded = service.encode(id, prefix);
            const decoded = service.decode(encoded, prefix);
            expect(decoded).toBe(id);
        });

        it('should throw InvalidSqidFormatException if prefix does not match', () => {
            const id = 1n;
            const encoded = service.encode(id, SqidsPrefix.USER);
            expect(() => service.decode(encoded, SqidsPrefix.DEPOSIT)).toThrow(InvalidSqidFormatException);
        });

        it('should throw InvalidSqidFormatException for invalid sqids', () => {
            expect(() => service.decode('invalid!')).toThrow(InvalidSqidFormatException);
        });
    });

    describe('prefix-based encoding', () => {
        it('should produce different sqid values for the same ID with different prefixes', () => {
            const id = 12345n;
            const encodedUser = service.encode(id, SqidsPrefix.USER);
            const encodedFile = service.encode(id, SqidsPrefix.FILE);
            const encodedDeposit = service.encode(id, SqidsPrefix.DEPOSIT);

            // 접두사 제거 후 sqid 부분만 비교
            const sqidUser = encodedUser.slice(2); // 'u_' 제거
            const sqidFile = encodedFile.slice(2); // 'f_' 제거
            const sqidDeposit = encodedDeposit.slice(2); // 'd_' 제거

            // 동일한 ID라도 prefix에 따라 다른 sqid가 생성되어야 함
            expect(sqidUser).not.toBe(sqidFile);
            expect(sqidUser).not.toBe(sqidDeposit);
            expect(sqidFile).not.toBe(sqidDeposit);
        });

        it('should correctly decode each prefix-encoded sqid', () => {
            const id = 99999n;
            const prefixes = [SqidsPrefix.USER, SqidsPrefix.FILE, SqidsPrefix.DEPOSIT, SqidsPrefix.WALLET_TRANSACTION];

            for (const prefix of prefixes) {
                const encoded = service.encode(id, prefix);
                const decoded = service.decode(encoded, prefix);
                expect(decoded).toBe(id);
            }
        });
    });
});

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
});

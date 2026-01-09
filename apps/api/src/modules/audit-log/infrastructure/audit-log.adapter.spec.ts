import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogAdapter } from './audit-log.adapter';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

describe('AuditLogAdapter', () => {
    let adapter: AuditLogAdapter;
    let prismaService: PrismaService;

    const mockSnowflakeId = 123456789012345678n;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuditLogAdapter,
                {
                    provide: PrismaService,
                    useValue: {
                        authAuditLog: {
                            create: jest.fn().mockResolvedValue({}),
                        },
                        activityLog: {
                            create: jest.fn().mockResolvedValue({}),
                        },
                        systemErrorLog: {
                            create: jest.fn().mockResolvedValue({}),
                        },
                        integrationLog: {
                            create: jest.fn().mockResolvedValue({}),
                        },
                    },
                },
            ],
        }).compile();

        adapter = module.get<AuditLogAdapter>(AuditLogAdapter);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(adapter).toBeDefined();
    });

    describe('saveAuthLog', () => {
        it('should save auth log with Snowflake ID converted to string', async () => {
            const payload = {
                action: 'LOGIN',
                status: 'SUCCESS',
            };

            await adapter.saveAuthLog(mockSnowflakeId, payload);

            expect(prismaService.authAuditLog.create).toHaveBeenCalled();
            const callArgs = (prismaService.authAuditLog.create as jest.Mock).mock.calls[0][0];
            expect(callArgs.data.id).toBe(mockSnowflakeId);
            expect(callArgs.data.action).toBe('LOGIN');
            expect(callArgs.data.status).toBe('SUCCESS');
        });
    });

    describe('saveActivityLog', () => {
        it('should save activity log with Snowflake ID', async () => {
            const payload = {
                category: 'GAME',
                action: 'BET_PLACED',
            };

            await adapter.saveActivityLog(mockSnowflakeId, payload);

            expect(prismaService.activityLog.create).toHaveBeenCalled();
            const callArgs = (prismaService.activityLog.create as jest.Mock).mock.calls[0][0];
            expect(callArgs.data.id).toBe(mockSnowflakeId);
            expect(callArgs.data.category).toBe('GAME');
            expect(callArgs.data.action).toBe('BET_PLACED');
        });
    });

    describe('saveSystemErrorLog', () => {
        it('should save system error log with Snowflake ID', async () => {
            const payload = {
                errorMessage: 'Test error',
                severity: 'ERROR' as const,
            };

            await adapter.saveSystemErrorLog(mockSnowflakeId, payload);

            expect(prismaService.systemErrorLog.create).toHaveBeenCalled();
            const callArgs = (prismaService.systemErrorLog.create as jest.Mock).mock.calls[0][0];
            expect(callArgs.data.id).toBe(mockSnowflakeId);
            expect(callArgs.data.errorMessage).toBe('Test error');
            expect(callArgs.data.severity).toBe('ERROR');
        });
    });

    describe('saveIntegrationLog', () => {
        it('should save integration log with Snowflake ID', async () => {
            const payload = {
                provider: 'NOWPAYMENT',
                method: 'POST',
                endpoint: '/api/payment',
                duration: 150,
                success: true,
            };

            await adapter.saveIntegrationLog(mockSnowflakeId, payload);

            expect(prismaService.integrationLog.create).toHaveBeenCalled();
            const callArgs = (prismaService.integrationLog.create as jest.Mock).mock.calls[0][0];
            expect(callArgs.data.id).toBe(mockSnowflakeId);
            expect(callArgs.data.provider).toBe('NOWPAYMENT');
            expect(callArgs.data.success).toBe(true);
        });
    });
});

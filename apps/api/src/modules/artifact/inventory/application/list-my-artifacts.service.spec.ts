import { ListMyArtifactsService } from './list-my-artifacts.service';
import { SqidsService } from 'src/infrastructure/sqids/sqids.service';

describe('ListMyArtifactsService', () => {
  it('maps repository entities to DTOs', async () => {
    const repo = { findManyByUserId: jest.fn().mockResolvedValue([[{ id: 1n, catalog: { code: 'C1', grade: 'COMMON' }, slotNo: null, isEquipped: false, createdAt: new Date() }], 1]) };
    const sqids = { encode: jest.fn().mockReturnValue('encoded') } as any as SqidsService;

    const svc = new ListMyArtifactsService(repo as any, sqids);
    const res = await svc.execute(1n, { page: 1, limit: 10 } as any);

    expect(res.total).toBe(1);
    expect(res.data[0].id).toBe('encoded');
    expect(repo.findManyByUserId).toHaveBeenCalled();
  });
});

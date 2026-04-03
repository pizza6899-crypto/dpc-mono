import { FindBannersService } from './find-banners.service';

describe('FindBannersService', () => {
  let service: FindBannersService;
  const mockRepo = { list: jest.fn(), count: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FindBannersService(mockRepo);
  });

  it('returns paginated result', async () => {
    const data = [{ id: 1n }];
    mockRepo.list.mockResolvedValue(data);
    mockRepo.count.mockResolvedValue(1);

    const res = await service.execute({ page: 2, limit: 10 } as any);

    expect(mockRepo.list).toHaveBeenCalled();
    expect(mockRepo.count).toHaveBeenCalled();
    expect(res.data).toBe(data);
    expect(res.page).toBe(2);
  });
});

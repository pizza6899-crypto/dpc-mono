import { GetBannerByIdService } from './get-banner-by-id.service';

describe('GetBannerByIdService', () => {
  let service: GetBannerByIdService;
  const mockRepo = { getById: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GetBannerByIdService(mockRepo);
  });

  it('returns banner from repository', async () => {
    const banner = { id: 5n } as any;
    mockRepo.getById.mockResolvedValue(banner);

    const res = await service.execute(5n);
    expect(mockRepo.getById).toHaveBeenCalledWith(5n);
    expect(res).toBe(banner);
  });
});

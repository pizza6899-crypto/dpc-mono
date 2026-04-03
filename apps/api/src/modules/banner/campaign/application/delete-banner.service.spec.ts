import { DeleteBannerService } from './delete-banner.service';

describe('DeleteBannerService', () => {
  let service: DeleteBannerService;
  const mockRepo = { delete: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DeleteBannerService(mockRepo);
  });

  it('calls repository.delete with id', async () => {
    await service.execute(9n);
    expect(mockRepo.delete).toHaveBeenCalledWith(9n);
  });
});

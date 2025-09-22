import { Test, TestingModule } from '@nestjs/testing';
import { SilhouetteLikeService } from './silhouette-like.service';

describe('SilhouetteLikeService', () => {
  let service: SilhouetteLikeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SilhouetteLikeService],
    }).compile();

    service = module.get<SilhouetteLikeService>(SilhouetteLikeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

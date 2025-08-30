import { Test, TestingModule } from '@nestjs/testing';
import { SilhouetteService } from './silhouette.service';

describe('SilhouetteService', () => {
  let service: SilhouetteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SilhouetteService],
    }).compile();

    service = module.get<SilhouetteService>(SilhouetteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { SilhouetteController } from './silhouette.controller';

describe('SilhouetteController', () => {
  let controller: SilhouetteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SilhouetteController],
    }).compile();

    controller = module.get<SilhouetteController>(SilhouetteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

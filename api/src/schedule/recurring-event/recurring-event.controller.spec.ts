import { Test, TestingModule } from '@nestjs/testing';
import { RecurringEventController } from './recurring-event.controller';

describe('RecurringEventController', () => {
  let controller: RecurringEventController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecurringEventController],
    }).compile();

    controller = module.get<RecurringEventController>(RecurringEventController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsController} from './applications.controller.js';
import { ApplicationsService } from './applications.service.js';



describe('ApplicationsService', () => {
  let service: ApplicationsService;

  const mockApplicationsService={
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByJobSeeker: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers:[ApplicationsController],
      providers: [{
         provide: ApplicationsService,
         useValue: mockApplicationsService,
    },
  ],
  }).compile();

  service = module.get<ApplicationsService>(
    ApplicationsService,
  );
});

it('should be defined', () => {
  expect(service).toBeDefined();
})

it('should return all applications', async() => {

  const applications = [
  {
    applicationId:1,
    jobSeekerId: 2,
    jobId: 5,
    status: 'SUBMITTED',
  },
  ];

  mockApplicationsService.findAll.mockResolvedValue(
    applications,
  );
  await expect(service.findAll()).resolves.toEqual(
   applications
  );
});
});

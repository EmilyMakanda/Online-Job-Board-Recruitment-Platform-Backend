import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsController } from '../applications/applications.controller.js';
import { ApplicationsService } from '../applications/applications.service.js';
import { UsersService } from './users.service.js';


describe('UsersService', () => {
  let service: UsersService;

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
      providers: [
        UsersService,
        {
         provide: ApplicationsService,
         useValue: mockApplicationsService,
    },
  ],
  }).compile();

  service = module.get<UsersService>(UsersService);

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

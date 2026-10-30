import { Injectable, NotFoundException, ConflictException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Application} from './entities/application.entity.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';
import { UpdateApplicationDto } from './dto/update-application.dto.js';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private  applicationRepository: Repository<Application>, ){}
    
    async create(
      createApplicationDto: CreateApplicationDto, 
      jobSeekerId: number,
    ): Promise<Application>{
      const existingApplication = await 
    this.applicationRepository.findOne({
      where: {
        jobId: createApplicationDto.jobId,
        jobSeekerId,
      },
    });
    
    if(existingApplication) {
      throw new ConflictException(
        'You have already applied for this job.',
      );
    }

    const application = this.applicationRepository.create({
      jobId: createApplicationDto.jobId,
      jobSeekerId: jobSeekerId,
    });

      return await
      this.applicationRepository.save(application);
    } 

    async findAll(): Promise<Application[]>{
      return await this.applicationRepository.find()
    }

    async findOne(applicationId:number): Promise<Application>{

      const application = 
      await this.applicationRepository.findOne({
      where: {applicationId: applicationId, },
    });
    
    if (!application){
      throw new NotFoundException('Application not found.');
    }
    return application;
    }

    async findByJobSeeker(
      jobSeekerId: number,
    ): Promise<Application[]>{
      return await this.applicationRepository.find({
        where: {jobSeekerId: jobSeekerId, },
      });
    }

    async update(
      applicationId: number,
      updateApllicationdto: UpdateApplicationDto,
    ): Promise<Application>{

      const application = await this.findOne(applicationId);

      return this.applicationRepository.save(application);
    }

    async remove(applicationId: number): Promise<void>{

      const application = await this.findOne(applicationId);

      await this.applicationRepository.remove(application);
    }
}  
  
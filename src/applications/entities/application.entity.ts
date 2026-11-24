import{ Entity,PrimaryGeneratedColumn, Column, CreateDateColumn, type Relation, ManyToOne,  OneToMany, JoinColumn} from 'typeorm';
import { Job } from '../../jobs/entities/jobs.entity.js';
import { ApplicationDocument } from './application-document.entity.js';

export enum ApplicationStatus{
    SUBMITTED = 'SUBMITTED',
    IN_REVIEW = 'IN_REVIEW',
    ACCEPTED  = 'ACCEPTED',
    REJECTED  = 'REJECTED',
}

@Entity('Applications')
export class Application{

    @PrimaryGeneratedColumn({
        name: 'APPLICATION_ID',
        type: 'number',
    })
    applicationId: number;

    @Column({
        name: 'JOBSEEKER_ID',
        type: 'number',
    })
    jobSeekerId: number;

    @Column({
        name: 'STATUS',
        type: 'varchar2',
        length: 50,
        default: ApplicationStatus.SUBMITTED
    })
    status: ApplicationStatus;

    @Column({
      name: 'COVER_LETTER',  
      type: 'varchar2',
      length: 2000,
      nullable: true,
    })
     coverLetter: string | null;

     @Column({
        name: 'HIGHEST_EDUCATION',
        type: 'varchar2',
        length: 100,
        nullable: true,
      })
      highestEducation: string | null;

      @Column({
        name: 'FIELD_OF_STUDY',
        type: 'varchar2',
        length: 150,
        nullable: true,
      })
      fieldOfStudy: string | null;

      @Column({
        name: 'YEARS_OF_EXPERIENCE',
        type: 'number',
        nullable: true,
      })
      yearsOfExperience: number | null;

      @Column({
        name: 'CURRENT_EMLOYMENT_STATUS',
        type: 'varchar2',
        length: 50,
        nullable: true,
      })
      currentEmploymentStatus: string | null;

      @Column({
        name: 'EXPECTED_SALARY',
        type: 'number',
        nullable: true,
      })
      expectedSalary: number | null;

      @Column({
        name: 'NOTICE_PERIOD',
        type: 'varchar2',
        length: 100,
        nullable: true,
      })
      noticePeriod: string | null;

      @Column({
        name: 'AVAILABLE_START_DATE',
        type: 'date',
        nullable: true,
      })
      availableStartDate: Date | null;

    @Column({
        name: 'WILLING_TO_RELOCATE',
        type: 'number',
        nullable: true,
    })  
    willingToRelocate: number | null;

    @Column({
        name: 'PORTFOLIO_URL',
        type: 'varchar2',
        length: 500,
        nullable: true,
    })
    portfolioUrl: string | null;

    @Column({
      name: 'LINKEDIN_URL',
      type: 'varchar2',
      length: 500,
      nullable: true,
    })
    linkedinUrl: string | null;

    @Column({
      name: 'ADDITIONAL_ANSWERS',
      type: 'clob',
      nullable: true,
    })
    additionalAnswers: string | null;

    @CreateDateColumn({
        name: 'APPLIED_AT',
        type: 'timestamp',
    })
    appliedAt: Date

    @ManyToOne(() => Job, (job) => job.applications, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'JOB_ID', referencedColumnName: 'id' })
    job: Relation<Job>;

    @OneToMany(() => ApplicationDocument, (document) => document.application, { cascade: false,
     })  
     documents: Relation<ApplicationDocument[]>;
    
}

import{ Entity,PrimaryGeneratedColumn, Column, CreateDateColumn, type Relation, ManyToOne, JoinColumn} from 'typeorm';
import { Job } from '../../jobs/entities/jobs.entity.js';

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
        name: 'JOB_ID',
        type: 'number',
    })
    jobId: number;

    @Column({
        name: 'STATUS',
        type: 'varchar2',
        length: 30,
        default: 'SUBMITTED',
    })
    status: string;

    @Column({
      name: 'COVER_LETTER',  
      type: 'varchar2',
      length: 255,
      nullable: true,
    })
     coverLetter: string;
    @CreateDateColumn({
        name: 'APPLIED_AT',
        type: 'timestamp',
    })
    appliedAt: Date

    @ManyToOne(() => Job, (job) => job.applications, { nullable: false })
    @JoinColumn({ name: 'JOB_ID', referencedColumnName: 'id' })
    job: Relation<Job>;
}

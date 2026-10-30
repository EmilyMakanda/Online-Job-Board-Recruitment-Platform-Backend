import{ Entity,PrimaryGeneratedColumn, Column, CreateDateColumn} from 'typeorm';

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
    id: string;

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
}

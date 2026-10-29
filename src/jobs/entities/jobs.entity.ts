import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    type Relation
} from 'typeorm';
import { User } from '../../authentication/entities/user.entity.js';

export enum JobStatus {
    OPEN = 'OPEN',
    CLOSED ='CLOSED',
    DRAFT = 'DRAFT',
}

@Entity('jobs')
export class Job{
    // Fields for the Job entity

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'varchar', length: 150, nullable: false})
    title: string;

    @Column({type: 'varchar', length: 2000, nullable: false})
    description: string;

    @Column({type: 'varchar2', length: 100, nullable: false})
    location: string;

    @Index()
    @Column({type: 'varchar2', length: 20, default: JobStatus.OPEN,})
    status: JobStatus;
    
    @ManyToOne(()=>User, (user) => user.jobs, {onDelete: 'CASCADE'})
    @JoinColumn({ name: 'posted_by_user_id' })
    postedBy: Relation<User>;

    @CreateDateColumn({type: 'timestamp'})
    createdAt: Date;
    
    @UpdateDateColumn({type: 'timestamp'})
    updatedAt: Date;
}
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Pool } from "src/pools/pool.entity";

@Entity()
export class PoolEvent {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Pool, (pool) => pool.events, { eager: true })
    pool: Pool;

    @Column()
    eventType: string;

    @Column()
    user: string; //wallet pubkey

    @Column({ type: 'jsonb' })
    data: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;
}
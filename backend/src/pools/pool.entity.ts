import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from "typeorm";
import { Token } from "../tokens/token.entity";
import { PoolEvent } from "src/events/pool-event.entity";

@Entity()
export class Pool {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    poolAddress: string; //PDA derived from mint_x, mint_y

    @Column({ type: 'varchar', nullable: true })
    authority: string | null;

    @Column({ type: 'int' })
    baseFee: number;

    @Column({ nullable: true })
    lpMint: string;

    @ManyToOne(() => Token, { eager: true })
    tokenX: Token;

    @ManyToOne(() => Token, { eager: true })
    tokenY: Token;

    @OneToMany(() => PoolEvent, (event) => event.pool)
    events: PoolEvent[];

    @CreateDateColumn()
    createdAt: Date;
}
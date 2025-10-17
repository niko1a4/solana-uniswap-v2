import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Pool } from "src/pools/pool.entity";

@Entity()
export class Token {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    mintAddress: string;

    @Column({ nullable: true })
    symbol: string;

    @Column({ type: 'int', default: 6 })
    decimals: number;

    @OneToMany(() => Pool, (pool) => pool.tokenX)
    poolsAsX: Pool[];

    @OneToMany(() => Pool, (pool) => pool.tokenY)
    poolsAsY: Pool[];
}
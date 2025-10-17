import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pool } from './pool.entity';
import { TokensService } from 'src/tokens/tokens.service';


@Injectable()
export class PoolsService {
    constructor(
        @InjectRepository(Pool)
        private readonly poolRepo: Repository<Pool>,
        private readonly tokensService: TokensService) { }


    async createPool(data: {
        poolAddress: string;
        mintX: string;
        mintY: string;
        lpMint: string;
        baseFee: number;
        authority?: string | null;
    }) {
        //ensure token exists
        const tokenX = await this.tokensService.findOrCreate(data.mintX);
        const tokenY = await this.tokensService.findOrCreate(data.mintY);

        //check if pool already exists
        const existing = await this.poolRepo.findOne({ where: { poolAddress: data.poolAddress } });
        if (existing) return existing;

        const pool = this.poolRepo.create({
            poolAddress: data.poolAddress,
            authority: data.authority ?? null,
            baseFee: data.baseFee,
            lpMint: data.lpMint,
            tokenX,
            tokenY,
        });
        return this.poolRepo.save(pool);
    }

    async findAll() {
        return this.poolRepo.find({ relations: ['tokenX', 'tokenY'] });
    }

    async findByAddress(poolAddress: string) {
        return this.poolRepo.findOne({ where: { poolAddress }, relations: ['tokenX', 'tokenY'] });
    }

}

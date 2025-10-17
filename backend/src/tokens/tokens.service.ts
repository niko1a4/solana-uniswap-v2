import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from './token.entity';
@Injectable()
export class TokensService {
    constructor(@InjectRepository(Token) private readonly tokenRepo: Repository<Token>) { }

    async findOrCreate(mintAddress: string, symbol?: string, decimals = 6) {
        let token = await this.tokenRepo.findOne({ where: { mintAddress } });
        if (!token) {
            token = this.tokenRepo.create({ mintAddress, symbol, decimals });
            await this.tokenRepo.save(token);
        }
        return token;
    }

    async findAll() {
        await this.tokenRepo.find();
    }
}




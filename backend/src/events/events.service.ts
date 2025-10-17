import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoolEvent } from './pool-event.entity';
import { PoolsService } from '../pools/pools.service';
import {
    AnyPoolEventDTO,
    InitializePoolDTO,
    DepositDTO,
    WithdrawDTO,
    SwapDTO,
} from './event-types';

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name);

    constructor(
        @InjectRepository(PoolEvent)
        private readonly eventRepo: Repository<PoolEvent>,
        private readonly poolsService: PoolsService,
    ) { }

    async logFromDTO(dto: AnyPoolEventDTO) {
        switch (dto.eventType) {
            case 'InitializePool':
                return this.handleInitialize(dto);
            case 'Deposit':
                return this.handleDeposit(dto);
            case 'Withdraw':
                return this.handleWithdraw(dto);
            case 'Swap':
                return this.handleSwap(dto);
            default:
                this.logger.warn(`Unknown eventType ${(dto as any).eventType}`);
                return null;
        }
    }

    private async handleInitialize(dto: InitializePoolDTO) {
        const pool = await this.poolsService.createPool({
            poolAddress: dto.pool,
            mintX: dto.mint_x,
            mintY: dto.mint_y,
            lpMint: dto.lp_mint,
            baseFee: dto.base_fee,
            authority: dto.authority,
        });

        const event = this.eventRepo.create({
            eventType: 'InitializePool',
            user: dto.authority ?? '',
            data: dto as any,
            pool,
        });
        return this.eventRepo.save(event);
    }

    private async handleDeposit(dto: DepositDTO) {
        const pool = await this.poolsService.findByAddress(dto.pool);
        if (!pool) {
            this.logger.warn(`Deposit for unknown pool ${dto.pool}; skipping.`);
            return null;
        }
        const event = this.eventRepo.create({
            eventType: 'Deposit',
            user: dto.depositor,
            data: dto as any,
            pool,
        });
        return this.eventRepo.save(event);
    }

    private async handleWithdraw(dto: WithdrawDTO) {
        const pool = await this.poolsService.findByAddress(dto.pool);
        if (!pool) {
            this.logger.warn(`Withdraw for unknown pool ${dto.pool}; skipping.`);
            return null;
        }
        const event = this.eventRepo.create({
            eventType: 'Withdraw',
            user: dto.user,
            data: dto as any,
            pool,
        });
        return this.eventRepo.save(event);
    }

    private async handleSwap(dto: SwapDTO) {
        const pool = await this.poolsService.findByAddress(dto.pool);
        if (!pool) {
            this.logger.warn(`Swap for unknown pool ${dto.pool}; skipping.`);
            return null;
        }
        const event = this.eventRepo.create({
            eventType: 'Swap',
            user: dto.user,
            data: dto as any,
            pool,
        });
        return this.eventRepo.save(event);
    }

    async findAll() {
        return this.eventRepo.find();
    }
}
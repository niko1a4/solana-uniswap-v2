import { Module } from '@nestjs/common';
import { PoolsController } from './pools.controller';
import { PoolsService } from './pools.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokensModule } from 'src/tokens/tokens.module';
import { Pool } from './pool.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pool]), TokensModule],
  controllers: [PoolsController],
  providers: [PoolsService],
  exports: [PoolsService],
})
export class PoolsModule { }

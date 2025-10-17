import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoolEvent } from './pool-event.entity';
import { PoolsModule } from 'src/pools/pools.module';

@Module({
  imports: [TypeOrmModule.forFeature([PoolEvent]), PoolsModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule { }

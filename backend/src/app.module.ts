import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoolsModule } from './pools/pools.module';
import { TokensModule } from './tokens/tokens.module';
import { EventsModule } from './events/events.module';
import { IndexerService } from './indexer/indexer.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'uniswapv2',
      autoLoadEntities: true,
      synchronize: true,
    }),
    PoolsModule,
    TokensModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService, IndexerService],
})
export class AppModule { }

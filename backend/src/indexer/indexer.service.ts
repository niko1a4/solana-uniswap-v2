import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { EventsService } from '../events/events.service';
import { AnchorProvider, Program, Idl, web3, setProvider } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnyPoolEventDTO } from '../events/event-types';
import idl from '../../../anchor/target/idl/uniswapv2.json';


@Injectable()
export class IndexerService implements OnModuleInit {
    private readonly logger = new Logger(IndexerService.name);
    private program!: Program;

    constructor(private readonly eventsService: EventsService) { }

    async onModuleInit() {
        //connection and provider setup
        const rpcUrl = process.env.RPC_URL ?? 'https://api.devnet.solana.com';
        const connection = new Connection(rpcUrl, 'confirmed');

        const provider = AnchorProvider.env();
        setProvider(provider);
        const programId = new PublicKey(process.env.PROGRAM_ID!);
        this.program = new Program(idl as Idl, provider);

        this.logger.log(`Listening to events for program ${programId.toBase58()}...`);

        await this.listenToEvents();
    }


    private async listenToEvents() {
        //initialize pool
        this.program.addEventListener('initializePoolEvent', async (event: any) => {
            console.log(`Got event:`, event);
            try {
                const dto: AnyPoolEventDTO = {
                    eventType: "InitializePool",
                    pool: event.pool.toBase58(),
                    mint_x: event.mintX.toBase58(),
                    mint_y: event.mintY.toBase58(),
                    lp_mint: event.lpMint.toBase58(),
                    base_fee: event.baseFee,
                    authority: event.authority ? event.authority.toBase58() : null,
                };
                await this.eventsService.logFromDTO(dto);
                this.logger.log(`InitializePool saved for pool ${dto.pool}`);
            } catch (err) {
                this.logger.error('Error handling InitializePool', err);
            }
        });

        //deposit tokens
        this.program.addEventListener('depositEvent', async (event: any) => {
            this.logger.debug("Swap event raw:", event);
            this.logger.debug("Swap event keys:", Object.keys(event));
            try {
                const dto: AnyPoolEventDTO = {
                    eventType: 'Deposit',
                    pool: event.pool.toBase58(),
                    depositor: event.depositor.toBase58(),
                    amount_x: event.amountX.toString(),
                    amount_y: event.amountY.toString(),
                    lp_minted: event.lpMinted.toString(),
                };
                await this.eventsService.logFromDTO(dto);
                this.logger.log(`Deposit saved for pool ${dto.pool}`);
            } catch (err) {
                this.logger.error('Error handling Deposit', err);
            }
        });

        //Withdraw
        this.program.addEventListener('withdrawEvent', async (event: any) => {
            this.logger.debug("Swap event raw:", event);
            this.logger.debug("Swap event keys:", Object.keys(event));
            try {
                const dto: AnyPoolEventDTO = {
                    eventType: 'Withdraw',
                    pool: event.pool.toBase58(),
                    user: event.user.toBase58(),
                    lp_burned: event.lpBurned.toString(),
                    amount_x: event.amountX.toString(),
                    amount_y: event.amountY.toString(),
                };
                await this.eventsService.logFromDTO(dto);
                this.logger.log(`Withdraw saved for pool ${dto.pool}`);
            } catch (err) {
                this.logger.error('Error handling Withdraw', err);
            }
        });

        //swap
        this.program.addEventListener('swapEvent', async (event: any) => {
            this.logger.debug("Swap event raw:", event);
            this.logger.debug("Swap event keys:", Object.keys(event));
            try {
                const dto: AnyPoolEventDTO = {
                    eventType: 'Swap',
                    pool: event.pool.toBase58(),
                    user: event.user.toBase58(),
                    token_in: event.tokenIn.toBase58(),
                    token_out: event.tokenOut.toBase58(),
                    amount_in: event.amountIn.toString(),
                    amount_out: event.amountOut.toString(),
                }
                await this.eventsService.logFromDTO(dto);
                this.logger.log(`Swap saved for pool ${dto.pool}`);
            } catch (err) {
                this.logger.error('Error handling Swap', err);
            }
        });
    }
}
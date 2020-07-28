/* eslint prettier/prettier: 0 */

import { ApplicationBootstrap, BUS_SYMBOLS }                     from '@node-ts/bus-core'
import { BUS_INTERNAL_SYMBOLS }                                  from '@node-ts/bus-core/dist/bus-symbols'
import { Container }                                             from 'inversify'

import { Logger }                                                from '@atlantis-lab/nestjs-logger'
import { DynamicModule, Module }                                 from '@nestjs/common'
import { OnApplicationBootstrap, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ModuleRef }                                             from '@nestjs/core'
import { MessageAttributes }                                     from '@node-ts/bus-messages'

import { Bus }                                                   from './bus'
import { HandlerRegistry }                                       from './handler'
import { ExplorerService }                                       from './services'

@Module({})
export class BusCoreModule implements OnModuleInit, OnModuleDestroy, OnApplicationBootstrap {
  private readonly applicationBootstrap: any

  private readonly bus: any

  constructor(private readonly explorerService: ExplorerService) {}

  static forRoot(transportProvider: any): DynamicModule {
    const messageHandlingContextProvider = {
      provide: BUS_SYMBOLS.MessageHandlingContext,
      useValue: new MessageAttributes(),
    }
    const handlerRegistryProvider = {
      provide: HandlerRegistry,
      useFactory: (logger: any, moduleRef: any) => new HandlerRegistry(logger, moduleRef),
      inject: [Logger, ModuleRef],
    }
    const busProvider = {
      provide: Bus,
      useFactory: (
        transport: any,
        logger: any,
        handlerRegistry: any,
        messageHandlingContext: any
      ) => new Bus(transport, logger, handlerRegistry, messageHandlingContext),
      inject: [BUS_SYMBOLS.Transport, Logger, HandlerRegistry, BUS_SYMBOLS.MessageHandlingContext],
    }
    const applicationBootstrapProvider = {
      provide: ApplicationBootstrap,
      useFactory: (bus: any, transport: any, handlerRegistry: any, logger: any) =>
        new ApplicationBootstrap(bus, transport, handlerRegistry, logger),
      inject: [Bus, BUS_SYMBOLS.Transport, HandlerRegistry, Logger],
    }
    return {
      module: BusCoreModule,
      providers: [
        ExplorerService,
        messageHandlingContextProvider,
        handlerRegistryProvider,
        transportProvider,
        busProvider,
        applicationBootstrapProvider,
      ],
      exports: [busProvider, applicationBootstrapProvider, handlerRegistryProvider],
    }
  }

  async onModuleInit(): Promise<void> {
    const { events } = this.explorerService.explore()
    events.map((event: any) => this.applicationBootstrap.registerHandler(event))
  }

  async onApplicationBootstrap(): Promise<void> {
    const container = new Container()
    container.bind(BUS_INTERNAL_SYMBOLS.SessionScopeBinder).toConstantValue((bind: any) => {
      bind(BUS_SYMBOLS.Bus).toConstantValue(this.bus)
    })

    await this.applicationBootstrap.initialize(container)
  }

  async onModuleDestroy(): Promise<void> {
    await this.applicationBootstrap.dispose()
  }
}
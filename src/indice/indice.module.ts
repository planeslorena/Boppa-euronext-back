import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IndiceService } from "./indice.service";
import { IndiceController } from "./indice.controller";
import { Cotizacion } from "src/empresa/entities/cotizacion.entity";
import { GempresaService } from "src/services/gempresa.service";
import { Indice } from "./entities/indice.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Indice, Cotizacion])],
    controllers: [IndiceController],
    providers: [IndiceService, GempresaService],
    exports: [IndiceService]
  })
  export class IndiceModule {} 
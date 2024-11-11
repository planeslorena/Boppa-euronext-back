import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Empresa } from "./entities/empresa.entity";
import { EmpresaController } from "./empresa.controller";
import { EmpresaService } from "./empresa.service";
import { Cotizacion } from "./entities/cotizacion.entity";
import { GempresaService } from "src/services/gempresa.service";

@Module({
    imports: [TypeOrmModule.forFeature([Empresa,Cotizacion]) ],
    controllers: [EmpresaController],
    providers: [EmpresaService,GempresaService],
    exports: [EmpresaService]
  })
  export class EmpresaModule {} 
import { Controller, Get, Param, Query } from "@nestjs/common";
import { IndiceService } from "./indice.service";
import { ICotizacionIndice } from "./model/ICotizacionIndice";
import { Indice } from "./entities/indice.entity";

@Controller('indices')
export class IndiceController {
  constructor(private readonly indiceService: IndiceService) {}

  @Get('/getCotizaciones')
  async getCotizaciones(
    @Query('dias') dias: number,
    @Query('allIndices') allIndices: number,
  ): Promise<Indice[][]> {
     return await this.indiceService.getDatosGrafico({dias: dias, allIndices: allIndices});
  }
}
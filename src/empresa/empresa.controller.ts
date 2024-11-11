import { Controller, Get, Param } from "@nestjs/common";
import { EmpresaService } from "./empresa.service";
import { GempresaService } from "src/services/gempresa.service";

@Controller('empresas')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService, private readonly gempresaService: GempresaService) {}

  //Prueba de conexion con gempresa: OK
  @Get('/:codigoEmpresa/details')
  async getDetalleEmpresa(
    @Param('codigoEmpresa') codigoEmpresa: string,
  ): Promise<any> {
    return await this.gempresaService.getEmpresaDetails(codigoEmpresa);
  }

  @Get('/:codigoEmpresa/ultima')
  async getUltimaCotizacion(
    @Param('codigoEmpresa') codigoEmpresa: string,
  ): Promise<any> {
    return await this.empresaService.getUltimaCotizacion(codigoEmpresa);
  }

}
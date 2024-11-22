import { Controller, Get, Param } from "@nestjs/common";
import { EmpresaService } from "./empresa.service";
import { GempresaService } from "src/services/gempresa.service";
import { IEmpresa } from "./model/IEmpresa";

@Controller('empresas')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService, private readonly gempresaService: GempresaService) { }

  //Trae los datos de todas las empresas
  @Get()
  async getAllEmpresas(): Promise<IEmpresa[]> {
    return await this.empresaService.getAllEmpresas();
  }

  //Prueba de conexion con gempresa: OK
  @Get('/:codigoEmpresa/details')
  async getDetalleEmpresa(
    @Param('codigoEmpresa') codigoEmpresa: string,
  ): Promise<any> {
    return await this.gempresaService.getEmpresaDetails(codigoEmpresa);
  }

  //Trae los datos de todas las empresas, sus cotizaciones actuales y la variacion
  @Get('/ultimasCotizaciones')
  async getUltCotizaciones(): Promise<any[]> {
    return await this.empresaService.cotizacionActual();
  }
}
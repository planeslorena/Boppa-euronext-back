import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Empresa } from "./entities/empresa.entity";
import { Cotizacion } from "./entities/cotizacion.entity";
import { Between, FindManyOptions, FindOptionsWhere, Repository } from "typeorm";

@Injectable()
export class EmpresaService {
  //private logger: Logger = new Logger(EmpresaService.name);

  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    @InjectRepository(Cotizacion)
    private readonly cotizacionRepository: Repository<Cotizacion>,
  ) {}

  //Obtengo los datos de todas las empresas de la bolsa
  async getAllEmpresas (): Promise<Empresa[]> {
    return await this.empresaRepository.find();
  }


  //Obtengo la ultima cotizacion guardada de una empresa
  async getUltimaCotizacion (codigoEmpresa: string): Promise<Cotizacion> {
    const criterio: FindManyOptions<Cotizacion> = { 
      where: {empresa : {codEmpresa : codigoEmpresa}},
      order: {
          dateUTC: "DESC",
          hora: "DESC"
      },
      take: 1,
   };

    const ultCotizacion = await this.cotizacionRepository.find(criterio);
    return ultCotizacion[0];
  }

  //Obtengo las cotizaciones de una empresa en un rango de fechas y horas dados
  async getCotizacionesByFecha ( codigoEmpresa: string,
    fechaDesde: string,
    fechaHasta: string,
  ): Promise<Cotizacion[]> {
    const fechaDesdeArray = fechaDesde.split('T');
    const fechaHastaArray = fechaHasta.split('T');

    const criterio: FindOptionsWhere<Cotizacion> = {
      empresa: {
        codEmpresa: codigoEmpresa,
      },
      dateUTC: Between(fechaDesdeArray[0], fechaHastaArray[0]),
    };

    const cotizaciones: Cotizacion[] =
      await this.cotizacionRepository.findBy(criterio);
    return cotizaciones.filter((cot) => {
      let validoDesde = true;
      let validoHasta = true;
      if (cot.fecha == fechaDesdeArray[0]) {
        if (cot.hora < fechaDesdeArray[1]) {
          validoDesde = false;
        }
      }
      if (cot.fecha == fechaHastaArray[0]) {
        if (cot.hora > fechaHastaArray[1]) {
          validoHasta = false;
        }
      }
      return validoDesde && validoHasta;
    });
  }

  async createCotizacion(cotizacion:Cotizacion): Promise<Cotizacion> {
    return await this.cotizacionRepository.save(cotizacion);
  }

}

  


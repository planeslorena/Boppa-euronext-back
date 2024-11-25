import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Empresa } from "./entities/empresa.entity";
import { Cotizacion } from "./entities/cotizacion.entity";
import { Between, FindManyOptions, FindOptionsWhere, Not, Repository } from "typeorm";
import DateUtils from "src/utils/dateUtils";
import { GempresaService } from "src/services/gempresa.service";
import * as momentTZ from 'moment-timezone';


@Injectable()
export class EmpresaService {
  private logger: Logger = new Logger(EmpresaService.name);

  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    @InjectRepository(Cotizacion)
    private readonly cotizacionRepository: Repository<Cotizacion>,
    private readonly gempresaService: GempresaService
  ) { }

  //Obtengo los datos de todas las empresas de la bolsa
  async getAllEmpresas(): Promise<Empresa[]> {
    try {
      return await this.empresaRepository.find();
    } catch (error) {
      this.logger.error(error);
    }
  }


  //Obtengo la ultimas 7 cotizaciones de una empresa
  async getUltimasCotizaciones(codigoEmpresa: string): Promise<Cotizacion[]> {
    try {
      const criterio: FindManyOptions<Cotizacion> = {
        where: { empresa: { codEmpresa: codigoEmpresa } },
        order: {
          dateUTC: "DESC",
          hora: "DESC"
        },
        take: 12,
      };

      const ultCotizaciones = await this.cotizacionRepository.find(criterio);
      return ultCotizaciones;
    } catch (error) {
      this.logger.error(error);
    }
  }

  //Obtengo las cotizaciones de una empresa en un rango de fechas y horas dados
  async getCotizacionesByFecha(codigoEmpresa: string,
    fechaDesde: string,
    fechaHasta: string,
  ): Promise<Cotizacion[]> {
    const fechaDesdeArray = fechaDesde.split('T');
    const fechaHastaArray = fechaHasta.split('T');

    try {
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
    } catch (error) {
      this.logger.error(error);
    }
  }

  //Guardo la cotización de una empresa en la base de datos
  async createCotizacion(cotizacion: Cotizacion): Promise<Cotizacion> {
    try {
      return await this.cotizacionRepository.save(cotizacion);
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * Obtengo las cotizaciones de todas las empresas de la bolsa de Gempresa
   */
  async obtenerDatosEmpresas() {
    //Busco todas las empresas de la bolsa
    const empresas: Empresa[] = await this.getAllEmpresas();

    //Las recorro para buscar las cotizaciones faltantes
    empresas.forEach(async empresa => {
      //Busco la ultima cotizacion guardada de la empresa
      const ultimasCot: Cotizacion[] = await this.getUltimasCotizaciones(empresa.codEmpresa);
      let ultimaCot = ultimasCot[0];

      let fechaDesde = '';
      if (!ultimaCot) {
        fechaDesde = '2024-01-01T01:00:00.000Z';
      } else {
        fechaDesde = ultimaCot.fecha+'T'+ultimaCot.hora
      }

      //La fecha desde será la fecha y hora de la ult cotizacion convertida a UTC mas una hora (en este caso vuelve a quedar la misma fecha desde porq Amsterdam es UTC+1)
      fechaDesde = momentTZ.tz(fechaDesde,process.env.TIME_ZONE).utc().add(1,'hour').toISOString().substring(0,16);

      //Fecha Hasta es este momento
      const fechaHasta = (new Date()).toISOString().substring(0, 16);

      //Busco las cotizaciones faltantes
      const cotizaciones: Cotizacion[] = await this.gempresaService.getCotizaciones(empresa.codEmpresa, fechaDesde, fechaHasta);

      //Tengo que chequear que esten dentro de los rangos que me interesan (Lu a Vi de 9 a 15hs (hora de amsterdam))
      //O sea de 8 a 14 hora UTC
      const cotizacionesValidas = cotizaciones.filter((cot) => {
        let validoDia = true;
        let validoHora = true;
        const horaAperturaUTC = momentTZ.tz(cot.fecha + ' ' + process.env.HORA_APERTURA,process.env.TIME_ZONE).utc().format('HH:mm');
        const horaCierreUTC = momentTZ.tz(cot.fecha + ' ' + process.env.HORA_CIERRE,process.env.TIME_ZONE).utc().format('HH:mm');
        
        const dia = (DateUtils.getFechaFromRegistroFecha({ fecha: cot.fecha, hora: cot.hora })).getDay();

        if (dia == 0 || dia == 6) {
          validoDia = false;
        }
        if (cot.hora < horaAperturaUTC|| cot.hora > horaCierreUTC) {
          validoHora = false;
        }
        return validoDia && validoHora;
      })

      //Las inserto en la tabla cotizaciones con la hora de amsterdam
      cotizacionesValidas.forEach(async cotizacion => {
        const fechaAmsterdam = momentTZ.utc(cotizacion.fecha + ' ' + cotizacion.hora).tz(process.env.TIME_ZONE);
        this.createCotizacion({
          fecha: fechaAmsterdam.format('YYYY-MM-DD'),
          hora: fechaAmsterdam.format('HH:mm'),
          dateUTC: cotizacion.dateUTC,
          cotization: cotizacion.cotization,
          empresa: empresa,
          id: null
        });
      })

    });
  }

  /**
   * Funcion que retorna las ultimas cotizaciones de cada empresa y la variacion diaria
   */
  async cotizacionActual(): Promise<any[]> {
    //Busco todas las empresas de la bolsa
    const empresas: Empresa[] = await this.getAllEmpresas();

    //Las recorro para buscar las cotizaciones faltantes
    let cotizaciones = await Promise.all(empresas.map(async empresa => {
      //Busco la ultima cotizacion guardada de la empresa
      const ultimaCot = await this.getUltimasCotizaciones(empresa.codEmpresa);

      //Busco la cotizacion de cierre anterior
      const criterio: FindManyOptions<Cotizacion> = {
        where: { empresa: { codEmpresa: empresa.codEmpresa }, hora: process.env.HORA_CIERRE, fecha: Not(ultimaCot[0].fecha) },
        order: {
          fecha: "DESC"
        },
        take: 1,
      };
      const cotAnterior = await this.cotizacionRepository.find(criterio);

      const variacion = Number(((ultimaCot[0].cotization - cotAnterior[0].cotization) / cotAnterior[0].cotization * 100).toFixed(2));
      return ({
        codEmpresa: empresa.codEmpresa,
        empresaNombre: empresa.empresaNombre,
        ultimaCot: ultimaCot[0].cotization,
        variacion: variacion
      });
    })
    );
    return cotizaciones;
  }
}




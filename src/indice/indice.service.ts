import { InjectRepository } from "@nestjs/typeorm";
import { Indice } from "./entities/indice.entity";
import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { Between, FindManyOptions, FindOptionsWhere, Not, Repository } from "typeorm";
import { Cotizacion } from "src/empresa/entities/cotizacion.entity";
import { GempresaService } from "src/services/gempresa.service";
import { IIndice } from "./model/IIndice";
import DateUtils from "src/utils/dateUtils";
import * as momentTZ from 'moment-timezone';


@Injectable()
export class IndiceService {
  private logger: Logger = new Logger(IndiceService.name);

  constructor(
    @InjectRepository(Indice)
    private readonly indiceRepository: Repository<Indice>,
    @InjectRepository(Cotizacion)
    private readonly cotizacionRepository: Repository<Cotizacion>,
    private readonly gempresaService: GempresaService
  ) { }

  //Calcula el indice Euronext para los dias y horas faltantes
  async calcularIndices() {
    try {
      //Busco el ultimo indice guardado
      const ultIndice: Indice[] = await this.indiceRepository.find({
        where: { codigoIndice: 'N100' } ,
        order: {
          fecha: "DESC",
          hora: "DESC"
        },
        take: 1
      });

      let fechaUltIndice = '2023-12-31';
      //Si existen indices calculados, tomo la fecha y hora del ultimo
      if (ultIndice.length != 0) {
        fechaUltIndice = ultIndice[0].fecha;
      }

      //Calculo los indices faltantes
      const sql: string = `select 'N100' codigoIndice,avg(c.cotization)as valorIndice,c.fecha ,c.hora from cotizaciones c  where fecha >= '${fechaUltIndice}' group by c.fecha , c.hora order by c.fecha,c.hora`

      const indices: Indice[] = await this.cotizacionRepository.query(sql);

      if (!indices) {
        throw new HttpException(
          'No existen cotizaciones para calcular indices',
          HttpStatus.NOT_FOUND,
        );
      }

      //Inserto los indices en la tabla y lo envio a Gempresa
      indices.forEach(async (indice: Indice) => {
        if (indice.fecha == fechaUltIndice && indice.hora > ultIndice[0].hora) {
          await this.indiceRepository.save(indice);
          await this.gempresaService.postIndice(indice);
        } else if (indice.fecha != fechaUltIndice) {
          await this.indiceRepository.save(indice);
          await this.gempresaService.postIndice(indice);
        }
      })
    } catch (error) {
      this.logger.error(error);
    }
  }

  //Obtengo la ultima cotizacion guardada de un indice
  async getUltimoValorIndice(codigoIndice: string): Promise<Indice> {
    const criterio: FindManyOptions<Indice> = {
      where: { codigoIndice: codigoIndice },
      order: {
        fecha: "DESC",
        hora: "DESC"
      },
      take: 1,
    };

    const ultCotizacion = await this.indiceRepository.find(criterio);
    return ultCotizacion[0];
  }


  /**
   *Obtengo de Gempresa los indices de las demas bolsas y los guardo en mi base de datos
   */
  async obtenerIndices() {
    try {
      //Busco todas los indices
      const indices: IIndice[] = await this.gempresaService.getIndices();
      //Ls recorro para buscar las cotizaciones faltantes
      indices.forEach(async indice => {
        if (indice.code != 'N100') {
          //Busco la ultima cotizacion guardada de la empresa
          let ultimaCot: Indice = await this.getUltimoValorIndice(indice.code);

          let fechaDesde = ''
          if (!ultimaCot) {
            fechaDesde = '2024-01-01T00:00';
          } else {
            //Le agrego una hora a la fecha y hora de la ultima cotizacion guardada
            fechaDesde = (DateUtils.agregarUnaHora(DateUtils.getFechaFromRegistroFecha({ fecha: ultimaCot.fecha, hora: ultimaCot.hora }))).toISOString().substring(0, 16);
          }

          //Fecha Hasta es este momento
          const fechaHasta = (new Date()).toISOString().substring(0, 16);

          //Busco las cotizaciones faltantes
          const cotizaciones = await this.gempresaService.getCotizacionesIndices(indice.code, fechaDesde, fechaHasta);

          //Chequeo que las cotizaciones sean de dias habiles y de los horarios en que esta la bolsa abierta
          if (cotizaciones) {
            const cotizacionesValidas = cotizaciones.filter((cot) => {
              let validoDia = true;
              let validoHora = true;
              const horaApertura = process.env.HORA_APERTURA
              const horaCierre = process.env.HORA_CIERRE

              const dia = (DateUtils.getFechaFromRegistroFecha({ fecha: cot.fecha, hora: cot.hora })).getDay();

              if (dia == 0 || dia == 6) {
                validoDia = false;
              }
              if (cot.hora < horaApertura || cot.hora > horaCierre) {
                validoHora = false;
              }
              return validoDia && validoHora;
            })

            if (cotizacionesValidas) {
              //Las inserto en la tabla cotizaciones
              cotizacionesValidas.forEach(async cotizacion => {
                this.indiceRepository.save({
                  codigoIndice: cotizacion.code,
                  valorIndice: cotizacion.valor,
                  fecha: cotizacion.fecha,
                  hora: cotizacion.hora.substring(0, 5),
                  id: null
                });
              })
            }
          }
        }
      });
    } catch (error) {
      this.logger.error(error);
    }
  }
  /**
   * Funcion que obtiene las cotizaciones de un indice en un rango de fechas establecido
   * @param codigoIndice 
   * @param fechaDesde 
   * @param fechaHasta 
   * @returns 
   */
  async getIndicesbyFecha(codigoIndice: string,
    fechaDesde: string,
    fechaHasta: string,
  ): Promise<Indice[]> {
    const fechaDesdeArray = fechaDesde.split('T');
    const fechaHastaArray = fechaHasta.split('T');

    try {
      const criterio: FindManyOptions<Indice> = {
        where: {
          codigoIndice: codigoIndice,
          fecha: Between(fechaDesdeArray[0], fechaHastaArray[0])
        },
        order: {
          fecha: "ASC",
          hora: "ASC"
        },
      };

      const cotizaciones: Indice[] =
        await this.indiceRepository.find(criterio);
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

  /**
   * Función que obtiene los datos para cargar el grafico, segun cantidad de días a mostrar y si muestra todos los indices o solo el Euronext
   * @param criterio 
   * @returns 
   */
  async getDatosGrafico(criterio: { dias: number, allIndices: number }) {

    const ultIndice = await this.getUltimoValorIndice('N100');
    const fechaHasta = `${ultIndice.fecha}T${ultIndice.hora}`
    console.log(fechaHasta)
    const fechaDesde = momentTZ.tz(fechaHasta, process.env.TIME_ZONE).add(-criterio.dias, 'days').toISOString().substring(0, 16);
    console.log(fechaDesde)

    let codIndices: IIndice[] = [];

    if (criterio.allIndices == 1) {
      codIndices = await this.gempresaService.getIndices();
    } else {
      codIndices.push({ code: 'N100', name: 'Euronext 100 Index' });
    }

    const indices = codIndices.filter(indice => indice.code);

    const cotizaciones = indices.map(async indice => {
      const datosIndice= await this.getIndicesbyFecha(indice.code, fechaDesde, fechaHasta);
      return datosIndice;
    });
    const datos = await Promise.all(cotizaciones);
    const datosFiltrados = datos.filter(dataset => dataset.length != 0)
    return datosFiltrados;
  }

  /**
 * Funcion que retorna la ultima cotizacion del indice de la bolsa y la variacion diaria
 */
  async cotizacionActualIndice(): Promise<any> {

    //Las recorro para buscar las cotizaciones actuales
    const ultimaCot = await this.getUltimoValorIndice('N100');

    //Busco la cotizacion de cierre anterior
    const criterio: FindManyOptions<Indice> = {
      where: { codigoIndice: 'N100' , hora: process.env.HORA_CIERRE, fecha: Not(ultimaCot.fecha) },
      order: {
        fecha: "DESC"
      },
      take: 1,
    };
    const cotAnterior: Indice[] = await this.indiceRepository.find(criterio);

    const variacion = Number(((ultimaCot.valorIndice - cotAnterior[0].valorIndice) / cotAnterior[0].valorIndice * 100).toFixed(2));
    return ({
      codigoIndice: 'N100',
      ultimaCot: ultimaCot.valorIndice,
      variacion: variacion
    });
    }
}

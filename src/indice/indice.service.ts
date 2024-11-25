import { InjectRepository } from "@nestjs/typeorm";
import { Indice } from "./entities/indice.entity";
import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { FindManyOptions, Repository } from "typeorm";
import { Cotizacion } from "src/empresa/entities/cotizacion.entity";
import { GempresaService } from "src/services/gempresa.service";
import { IIndice } from "./model/IIndice";
import DateUtils from "src/utils/dateUtils";

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
        if (indice.codigoIndice != 'N100') {
          //Busco la ultima cotizacion guardada de la empresa
          let ultimaCot: Indice = await this.getUltimoValorIndice(indice.codigoIndice);

          let fechaDesde = ''
          if (!ultimaCot) {
            fechaDesde = '2024-01-01T01:00:00.000Z';
          } else {
            //Le agrego una hora a la fecha y hora de la ultima cotizacion guardada
            fechaDesde = (DateUtils.agregarUnaHora(DateUtils.getFechaFromRegistroFecha({ fecha: ultimaCot.fecha, hora: ultimaCot.hora }))).toISOString().substring(0, 16);
          }

          //Fecha Hasta es este momento
          const fechaHasta = (new Date()).toISOString().substring(0, 16);

          //Busco las cotizaciones faltantes
          const cotizaciones: Indice[] = await this.gempresaService.getCotizacionesIndices(indice.codigoIndice, fechaDesde, fechaHasta);

          //Las inserto en la tabla cotizaciones
          cotizaciones.forEach(async cotizacion => {
            this.indiceRepository.save({
              codigoIndice: cotizacion.codigoIndice, 
              valorIndice: cotizacion.valorIndice,
              fecha: cotizacion.fecha,
              hora: cotizacion.hora,
              id: null
            });
          })
        }
      });
    } catch (error) {
      this.logger.error(error);
    }
  }
}

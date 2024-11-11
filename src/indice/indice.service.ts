import { InjectRepository } from "@nestjs/typeorm";
import { Indice } from "./entities/indice.entity";
import { Injectable } from "@nestjs/common";
import { FindManyOptions, Repository } from "typeorm";
import { EmpresaService } from "src/empresa/empresa.service";
import { Empresa } from "src/empresa/entities/empresa.entity";
import { Cotizacion } from "src/empresa/entities/cotizacion.entity";
import DateUtils from "src/utils/dateUtils";

@Injectable()
export class IndiceService {
  //private logger: Logger = new Logger(EmpresaService.name);

  constructor(
    @InjectRepository(Indice)
    private readonly indiceRepository: Repository<Indice>,
    @InjectRepository(Cotizacion)
    private readonly cotizacionRepository: Repository<Cotizacion>
  ) { }

  async createIndices() {
    //Busco el ultimo indice guardado
    const ultIndice: Indice[] = await this.indiceRepository.find({
      order: {
        dateUTC: "DESC",
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
    const sql: string = `select 'N100' codigoIndice,avg(c.cotization)as valor, c.dateUTC ,c.fecha ,c.hora from cotizaciones c  where fecha > '${fechaUltIndice}' group by c.dateUTC ,c.fecha , c.hora order by c.dateUTC,c.fecha,c.hora`
    const indices: Indice[] = await this.cotizacionRepository.query(sql);

    //Inserto los indices en la tabla y lo envio a Gempresa
    indices.forEach(async (indice: Indice) => {
      if (indice.fecha == fechaUltIndice && indice.hora >= ultIndice[0].hora){
        await this.indiceRepository.save(indice);
      } else if (indice.fecha != fechaUltIndice) {
        await this.indiceRepository.save(indice);
      }
    })
  }
}
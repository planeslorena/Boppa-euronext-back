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

    let fechaUltIndice = ultIndice[0].fecha;
    let horaUltIndice = ultIndice[0].hora;

    //Si no existe, tomo como ultima el 31/12/23
    if (!fechaUltIndice) {
      fechaUltIndice = '2023-12-31';
      horaUltIndice = '23:00'      
    }

    //Calculo los indices faltantes
    const sql: string = `select 'N100' codigoIndice,avg(c.cotization)as valor, c.dateUTC ,c.fecha ,c.hora 
                          from cotizaciones c 
                          where fecha > ${fechaUltIndice}
                          and hora > ${horaUltIndice}
                          group by c.dateUTC ,c.fecha , c.hora 
                          order by c.dateUTC ,c.fecha  ,c.hora `
    const indices: Indice[] = await this.cotizacionRepository.query(sql);

    //Inserto los indices en la tabla y lo envio a Gempresa
    indices.forEach(async (indice:Indice) => {
      await this.indiceRepository.save(indice);
    })
  }
}
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { EmpresaService } from "src/empresa/empresa.service";
import { Cotizacion } from "src/empresa/entities/cotizacion.entity";
import { Empresa } from "src/empresa/entities/empresa.entity";
import { GempresaService } from "./gempresa.service";
import DateUtils from "src/utils/dateUtils";
import { Indice } from "src/indice/entities/indice.entity";
import { IndiceService } from "src/indice/indice.service";

@Injectable()
export class GenDataService {
    private logger: Logger = new Logger(GenDataService.name);

    constructor(
        private empresaService: EmpresaService, 
        private gempresaService: GempresaService, 
        private indiceService: IndiceService) {
        this.logger.log('Servicio Gen Data Inicializado');
        const hoy = new Date();
        console.log(hoy);
    }

    async obtenerDatosEmpresas() {
        //Busco todas las empresas de la bolsa
        const empresas: Empresa[] = await this.empresaService.getAllEmpresas();

        //Las recorro para buscar las cotizaciones faltantes
        empresas.forEach(async empresa => {
            //Busco la ultima cotizacion guardada de la empresa
            let ultimaCot: Cotizacion = await this.empresaService.getUltimaCotizacion(empresa.codEmpresa);

            //Si no existe, tomo como ultima el 31/12/23
            if (!ultimaCot) {
                ultimaCot = {
                    cotization: Number(empresa.cotizacionInicial),
                    dateUTC: '2023-12-31T23:00:00.000Z',
                    fecha: '2023-12-31',
                    hora: '23:00',
                    empresa: empresa,
                    id: 0
                };
            }

            //Le agrego una hora al dateUTC de la ultima cotizacion
            ultimaCot.dateUTC = (DateUtils.agregarUnaHora(DateUtils.getFechaFromRegistroFecha({fecha:ultimaCot.fecha,hora:ultimaCot.hora}))).toISOString().substring(0, 16);

            //Establezco como fecha de desde la fecha de la ultima cotizacion + una hora
            const fechaDesde = ultimaCot.dateUTC
            //Fecha Hasta es este momento
            const fechaHasta = (new Date()).toISOString().substring(0, 16);

            //Busco las cotizaciones faltantes
            const cotizaciones: Cotizacion[] = await this.gempresaService.getCotizaciones(empresa.codEmpresa, fechaDesde, fechaHasta);

            //Tengo que chequear que esten dentro de los rangos que me interesan (Lu a Vi de 9 a 15hs (hora de amsterdam))
            //O sea de 8 a 14 hora UTC
            const cotizacionesValidas=  cotizaciones.filter((cot) => {
                let validoDia = true;
                let validoHora = true;
                const dia = (DateUtils.getFechaFromRegistroFecha({ fecha: cot.fecha, hora: cot.hora })).getDay();

                if (dia == 0 || dia == 6) {
                    validoDia = false;
                }
                if (cot.hora < '08:00' || cot.hora > '14:00') {
                    validoHora = false;
                }
                return validoDia && validoHora;
            })


            //Las inserto en la tabla cotizaciones
            cotizacionesValidas.forEach(async cotizacion => {
                this.empresaService.createCotizacion({
                    fecha: cotizacion.fecha,
                    hora: cotizacion.hora,
                    dateUTC: cotizacion.dateUTC,
                    cotization: cotizacion.cotization,
                    empresa: empresa,
                    id: null
                });
            })

        });
    }



    //Establezco tarea programada que se ejecutara, cada una hora, en el minuto 5 de lunes a viernes de 9 a 15 hs. (el visual toma hora UTC?)
    //@Cron('0 5 9-15 * * 1-5')
    @Cron('0 59 * * * *')
    obtenerDatosHora() {
        this.logger.log('Obtener datos empresas iniciado');
        this.obtenerDatosEmpresas();
        this.logger.log('Generar Indice iniciado ');
        this.indiceService.createIndices();
    }
}
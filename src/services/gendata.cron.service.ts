import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { EmpresaService } from "src/empresa/empresa.service";
import { IndiceService } from "src/indice/indice.service";

@Injectable()
export class GenDataService {
    private logger: Logger = new Logger(GenDataService.name);

    constructor(
        private empresaService: EmpresaService, 
        private indiceService: IndiceService) {
        this.logger.log('Servicio Gen Data Inicializado');
    }

    //Establezco tarea programada que se ejecutara, cada una hora, en el minuto 5 de lunes a viernes de 9 a 15 hs. (el visual toma hora UTC?)
    //@Cron('0 5 * * * 1-5')
    @Cron('0 28 * * * *')
    obtenerDatos() {
        this.logger.log('Obtener datos empresas iniciado');
        this.empresaService.obtenerDatosEmpresas();
    }

   @Cron('0 35 * * * *')
    crearIndice() {
        this.logger.log('Generar Indice iniciado ');
        this.indiceService.calcularIndices();
    }

    @Cron('0 36 * * * *')
    obtenerIndices() {
        this.logger.log('Traer indices iniciado');
        this.indiceService.obtenerIndices();
    }
}
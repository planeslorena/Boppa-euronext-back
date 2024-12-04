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

    //Establezco tarea programada que se ejecutara, cada una hora.
    @Cron('0 3 * * * *')
    obtenerDatos() {
        this.logger.log('Obtener datos empresas iniciado');
        this.empresaService.obtenerDatosEmpresas();
    }

   @Cron('0 5 * * * *')
    crearIndice() {
        this.logger.log('Generar Indice iniciado ');
        this.indiceService.calcularIndices();
    }

    @Cron('0 7 * * * *')
    obtenerIndices() {
        this.logger.log('Traer indices iniciado');
        this.indiceService.obtenerIndices();
    }
}
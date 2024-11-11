import { Injectable } from "@nestjs/common";
import axios, { AxiosResponse } from "axios";
import { IEmpresa } from "src/empresa/model/IEmpresa";

@Injectable()
export class GempresaService {

    createClient = () => {
        const client = axios.create({
            baseURL: 'http://ec2-54-145-211-254.compute-1.amazonaws.com:3000'
        });
        return client;
    }
    public clientAxios = this.createClient();
    
    async getEmpresaDetails(codigoEmpresa: string): Promise<IEmpresa>{
        try {
            const respuesta: AxiosResponse<any, any> = await this.clientAxios.get(`/empresas/${codigoEmpresa}/details`);
            return respuesta.data;
        } catch (error:any) {
            return error.response.data.statusCode;
        }
    }

    async getCotizaciones(codigoEmpresa:string, fechaDesde:string, fechaHasta:string){
        try {
            const respuesta: AxiosResponse<any, any> = await this.clientAxios.get(`/empresas/${codigoEmpresa}/cotizaciones`,
                {params: {fechaDesde: fechaDesde, fechaHasta: fechaHasta} });
            return respuesta.data;
        } catch (error:any) {
            return error.response.data.statusCode;
        }
    }


}
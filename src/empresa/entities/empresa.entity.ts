import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Cotizacion } from './cotizacion.entity';

@Entity('empresas')
export class Empresa {
  @PrimaryGeneratedColumn({
    type: 'int',
  })
  public idEmpresa: number;

  @Column({
    name: 'codEmpresa',
    length: 20,
    nullable: false,
  })
  public codEmpresa: string;

  @Column({
    name: 'empresaNombre',
    length: 100,
    nullable: false,
  })
  public empresaNombre: string;

  @Column({
    name: 'cantidadAcciones',
    type: 'bigint',
    nullable: false,
  })
  public cantidadAcciones: number;

  @Column({
    name: 'cotizationInicial',
    type: 'decimal',
    precision: 7,
    scale: 2,
  })
  public cotizacionInicial: number;

  @OneToMany(() => Cotizacion, (cotizacion) => cotizacion.empresa)
  public cotizaciones: Cotizacion[];

  constructor(codigo:string, nombre: string) {
    this.codEmpresa = codigo;
    this.empresaNombre = nombre;
  }

  public getIdEmpresa():number {
    return this.idEmpresa;
  }

  public getCodigoEmpresa():string {
    return this.codEmpresa;
  }

  public setCodigoEmpresa(codigo:string):void {
    this.codEmpresa = codigo;
  }

  public getNombreEmpresa():string {
    return this.empresaNombre;
  }

  public setNombreEmpresa(nombre:string):void {
    this.empresaNombre = nombre;
  }

  public getCantAcciones():number {
    return this.cantidadAcciones;
  }

  public setCantAcciones(cantAcciones:number):void {
    this.cantidadAcciones = cantAcciones;
  }

  public getCotizacionInicial():number {
    return this.cotizacionInicial;
  }

  public setCotizacionInicial(cotizacionInicial:number):void {
    this.cotizacionInicial = cotizacionInicial;
  }
}
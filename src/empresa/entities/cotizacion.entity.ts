import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Empresa } from './empresa.entity';

@Entity('cotizaciones')
export class Cotizacion {
  @PrimaryGeneratedColumn({
    type: 'int',
  })
  public id: number;

  @Column({
    name: 'fecha',
    type: 'varchar',
    precision: 10,
  })
  public fecha: string;

  @Column({
    name: 'hora',
    type: 'varchar',
    precision: 5,
  })
  public hora: string;

  @Column({
    type: 'date',
  })
  public dateUTC: string;

  @Column({
    name: 'cotization',
    type: 'decimal',
    precision: 7,
    scale: 2,
  })
  public cotization: number;

  @ManyToOne(() => Empresa, (empresa) => empresa.cotizaciones)
  public empresa: Empresa;

  constructor(fecha:string, hora: string, dateUTC: string, cotizacion:number) {
    this.fecha = fecha;
    this.hora = hora;
    this.dateUTC = dateUTC;
    this.cotization = cotizacion;
  }


}
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('indices')
export class Indice {
  @PrimaryGeneratedColumn({
    type: 'int',
  })
  public idIndice: number;

  @Column({
    name: 'codigoIndice',
    length: 20,
    nullable: false,
  })
  public codigoIndice: string;

  @Column({
    type: 'int',
    nullable: false,
  })
  public valor: number;

  @Column({
    name: 'fecha',
    length: 20,
    nullable: false,
  })
  public fecha: string;

  @Column({
    name: 'hora',
    length: 20,
    nullable: false,
  })
  public hora: string;

  @Column({
    type: 'date',
  })
  public dateUTC: string;

  constructor(codigoIndice: string, valor:number, fecha: string, hora:string, dateUTC: string) {
    this.codigoIndice = codigoIndice;
    this.valor = valor;
    this.fecha = fecha;
    this.hora = hora;
    this.dateUTC = dateUTC;
  }

}
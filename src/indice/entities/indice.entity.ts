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
    name: 'valorIndice',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  public valorIndice: number;

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

  constructor(codigoIndice: string, valor:number, fecha: string, hora:string) {
    this.codigoIndice = codigoIndice;
    this.valorIndice = valor;
    this.fecha = fecha;
    this.hora = hora;
  }

}
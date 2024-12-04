import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresaModule } from './empresa/empresa.module';
import { ScheduleModule } from '@nestjs/schedule';
import { IndiceModule } from './indice/indice.module';
import { GenDataService } from './services/gendata.cron.service';
import { GempresaService } from './services/gempresa.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT),
      username: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB,
      synchronize: true,
      entities: ['dist/**/*.entity.js'],
      logging: 'all',
    }),
    EmpresaModule,
    IndiceModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService,GenDataService,GempresaService],
})
export class AppModule { }
 
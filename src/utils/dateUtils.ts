import { RegistroFecha } from "src/model/registroFecha";

class DateUtils {
  static getFechaFromRegistroFecha(fecha: RegistroFecha): Date {
    return new Date(`${fecha.fecha}T${fecha.hora}:00.000Z`);
  }

  // 2024-10-07T19:00:00.000Z
  static getRegistroFechaFromFecha(fecha: Date): RegistroFecha {
    const fechaStr = fecha.toISOString();
    return {
      fecha: fechaStr.substring(0, 10),
      hora: fechaStr.substring(11, 16),
    };
  }

  static agregarUnaHora(fecha: Date): Date {
    const currentMils = fecha.getTime();
    return new Date(currentMils + 1000 * 60 * 60);
  }
}


export default DateUtils;

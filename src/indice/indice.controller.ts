import { Controller, Get } from "@nestjs/common";
import { IndiceService } from "./indice.service";

@Controller('indices')
export class IndiceController {
  constructor(private readonly indiceService: IndiceService) {}


}
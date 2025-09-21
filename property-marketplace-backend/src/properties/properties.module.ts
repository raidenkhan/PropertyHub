import { Module } from '@nestjs/common';
import { PropertyService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';



@Module({
  controllers: [PropertiesController],
  providers: [PropertyService,CloudinaryService],
   exports: [PropertyService]
})
export class PropertiesModule {}

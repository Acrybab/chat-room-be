import { Module } from '@nestjs/common';
import { VideoController } from './controllers/video.controller';
import { VideoService } from './services/video.service';

@Module({
  controllers: [VideoController],
  providers: [VideoService],
})
export class TwilioModule {}

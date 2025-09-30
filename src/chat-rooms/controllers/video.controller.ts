import { Controller, Get, Query } from '@nestjs/common';
import { VideoService } from '../services/video.service';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}
  // Video controller methods go here

  @Get('token')
  getToken(
    @Query('identity') identity: string,
    @Query('roomId') roomId: string,
  ) {
    return this.videoService.generateToken(identity, roomId);
  }
}

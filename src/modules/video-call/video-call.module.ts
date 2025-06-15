import { Module } from '@nestjs/common';

import { VideoCallController } from './controllers/video-call.controller';
import { VideoCallGateway } from './gateways/video-call.gateway';
import { VideoCallService } from './services/video-call.service';

@Module({
  controllers: [VideoCallController],
  providers: [VideoCallGateway, VideoCallService],
  exports: [VideoCallService],
})
export class VideoCallModule {} 

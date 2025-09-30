import { Injectable, Logger } from '@nestjs/common';
import { jwt as TwilioJwt } from 'twilio';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  accountSid = process.env.TWILIO_ACCOUNT_SID || '';
  apiKeySid = process.env.TWILIO_API_KEY || '';
  apiKeySecret = process.env.TWILIO_API_SECRET || '';
  generateToken(identity: string, roomId?: string) {
    if (!this.accountSid || !this.apiKeySid || !this.apiKeySecret) {
      this.logger.error('Missing Twilio credentials in env');
      throw new Error('Twilio credentials not configured');
    }

    const AccessToken = TwilioJwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    const token = new AccessToken(
      this.accountSid,
      this.apiKeySid,
      this.apiKeySecret,
      { identity },
    );

    if (roomId) {
      token.addGrant(new VideoGrant({ room: roomId }));
    } else {
      token.addGrant(new VideoGrant());
    }

    return token.toJwt();
  }

  // Video service methods go here
}

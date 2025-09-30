import { Injectable, Logger } from '@nestjs/common';
import { jwt as TwilioJwt } from 'twilio';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  accountSid =
    process.env.TWILIO_ACCOUNT_SID || 'ACa20989cf19d98650a6c7d5775e573372';
  apiKeySid =
    process.env.TWILIO_API_KEY_SID || 'SKa0ea372ee850d6e6f418da6237764057';
  apiKeySecret =
    process.env.TWILIO_API_KEY_SECRET || 'lJfFh4V5crQ74XxKoqdvMkvpao4kCHYz';
  generateToken(identity: string, roomId?: string) {
    if (!this.accountSid || !this.apiKeySid || !this.apiKeySecret) {
      this.logger.error('Missing Twilio credentials in env');
      throw new Error('Twilio credentials not configured');
    }
    console.log(this.accountSid, this.apiKeySid, this.apiKeySecret, 'sssss');

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

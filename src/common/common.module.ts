import { Module } from '@nestjs/common';
import { MailService } from './services/mail.services';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.SENDGRID_HOST,
        port: process.env.SENDGRID_PORT,
        secure: true,
        auth: {
          user: process.env.SENDGRID_USER,
          pass: process.env.SENDGRID_PASS,
        },
      },
      defaults: {
        from: `"No Reply" <${process.env.MAIL_FROM}>`,
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class CommonModule {}

import { Module } from '@nestjs/common';
import { MailService } from './services/mail.services';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.sendgrid.net',
        port: 465,
        secure: true,
        auth: {
          user: 'apikey',
          pass: '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',
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

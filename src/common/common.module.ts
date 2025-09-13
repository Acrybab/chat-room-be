import { Module } from '@nestjs/common';
import { MailService } from './services/mail.services';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'trongkhangtn08032003@gmail.com',
          pass: 'ganw wmve rkjy hysy', // dùng App Password của Gmail
        },
      },
      defaults: {
        from: '"Chat Room" <trongkhangtn08032003@gmail.com>',
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class CommonModule {}

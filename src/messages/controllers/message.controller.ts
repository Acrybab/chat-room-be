/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateMessageDto } from '../dto/message.dto';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { MessageService } from '../services/message.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path/win32';
import { diskStorage as multerDiskStorage, StorageEngine } from 'multer';
import path from 'path';
import * as fs from 'fs';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}
  @Post()
  @UseGuards(JwtAuthGuard)
  createMessage(
    @Body() body: CreateMessageDto,
    @Req() req,
    @Param('roomId') roomId: number,
  ) {
    const userId = req.user.sub;
    return this.messageService.createMessage(
      body.content,
      userId as number,
      roomId,
    );
  }

  @Get(':roomId')
  @UseGuards(JwtAuthGuard)
  getMessages(@Param('roomId') roomId: number) {
    return this.messageService.getMessagesByRoom(roomId);
  }
  @Post(':roomId/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          // Tạo tên file: timestamp-random.ext
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file: Express.Multer.File, callback) => {
        const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf'];
        const ext = extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
          callback(null, true);
        } else {
          callback(new Error('Only image and PDF files are allowed'), false);
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
    @Param('roomId') roomId: number,
  ) {
    const userId = req.user.sub;
    const fileUrl = `${file.filename.trim()}`;
    // const fileUrl = `http://localhost:3000/uploads/${file.originalname}`;
    return this.messageService.createFileMessage(
      fileUrl,
      userId as number,
      roomId,
    );
  }
  @Get('photo/:photoName')
  getBookPhoto(@Param('photoName') photoName: string, @Res() res) {
    // return this.bookService.getBookPhoto(photoName).then((fileBuffer) => {
    //   res.setHeader('Content-Type', 'image/jpeg'); // Hoặc loại MIME phù hợp với ảnh của bạn
    //   res.send(fileBuffer);
    // });
    // console.log(process.cwd(), 'cwd');
    const filePath = path.join(
      'D:\\chat-room-be\\chat-room\\uploads',
      photoName,
    );
    if (!fs.existsSync(filePath)) {
      throw new Error('File không tồn tại');
    }

    return res.sendFile(filePath);
  }
}
function diskStorage(options: {
  destination: string;
  filename: (req: any, file: any, callback: any) => void;
}): StorageEngine {
  return multerDiskStorage({
    destination: options.destination,
    filename: options.filename,
  });
}
//   destination: string;
//   filename: (req: any, file: any, callback: any) => void;
// }): any {
//   throw new Error('Function not implemented.');
// }

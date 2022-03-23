import { Request } from 'express';

const maxSize = 5 * 1024 * 1024;

const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req: Request, file: any, callback: any) => {
    callback(null, 'uploads');
  },
  filename: (req: Request, file: any, callback: any) => {
    const match = ['image/png', 'image/jpeg'];

    if (match.indexOf(file.mimetype) === -1) {
      const message = `${file.originalname} is invalid. Only accept png/jpeg.`;
      return callback(message, null);
    }

    const filename = `${file.originalname}-${Date.now()}.${
      file.mimetype.split('/')[1]
    }`;

    callback(null, filename);
  },
});

const uploadFiles = multer({
  storage,
  limits: { fileSize: maxSize },
}).array('images', 10);

export default uploadFiles;

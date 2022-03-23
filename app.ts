import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import db from './models';
import swaggerUI from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import * as dotenv from 'dotenv';

import userRoutes from './routes/user.route';
import petRoutes from './routes/pet.route';
import orderRoutes from './routes/order.route';

const app = express();
dotenv.config();

db.sequelize
  .sync()
  .then(() => {
    console.log('Drop and re-sync db.');
  })
  .catch((err: any) => {
    console.error(err);
  });

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Library API',
      version: '1.0.0',
      description: 'A simple Express Library API',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./swagger/*.yml'],
};

const specs = swaggerJsDoc(options);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/images', express.static('uploads'));
app.use('/users', userRoutes);
app.use('/pets', petRoutes);
app.use('/store', orderRoutes);

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs));

app.listen(process.env.PORT || 3000, () => {
  console.log('Server is up on port 3000');
});

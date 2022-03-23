import db from '../models';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const { User, Address } = db;

const checkAuth = async (req: Request, res: Response, next: NextFunction) => {
  const bearerHeader = req.headers['authorization'];

  if (bearerHeader) {
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    try {
      const user = await verifyAccessToken(bearerToken);
      req.authUser = user;

      next();
    } catch (error: any) {
      console.error(error);

      if (error.message.includes('User not found')) {
        res.status(404);
      } else {
        res.status(500);
      }

      res.send({ error: error.message });
    }
  } else {
    // Forbidden
    res.status(401).send({
      message: 'You are unauthorized',
    });
  }
};

const verifyAccessToken = async (token: string) => {
  try {
    const decoded = await jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string
    );

    const userEmail = (<any>decoded).userEmail;

    const user = await User.findOne({
      where: { email: userEmail },
      include: [
        {
          model: Address,
          as: 'addresses',
        },
      ],
      attributes: {
        exclude: ['password'],
      },
    });
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error: any) {
    throw new Error(error);
  }
};

export default checkAuth;

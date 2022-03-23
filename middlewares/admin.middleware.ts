import { Request, Response, NextFunction } from 'express';

const checkAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.authUser.role === 'user') {
    res.status(403).send({ message: 'You are not authorized.' });
  }

  next();
};

export default checkAdmin;

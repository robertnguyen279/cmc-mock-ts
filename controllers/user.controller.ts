import db from '../models';
import redisClient from '../services/redis.service';
import jwt from 'jsonwebtoken';
import filterBody from '../services/filterBody.service';
import { Request, Response } from 'express';

const { User, Address } = db;

const validUserKeys = [
  'firstName',
  'lastName',
  'email',
  'password',
  'addresses',
  'age',
  'phone',
];

const validAddressKeys = ['unit', 'road', 'city'];

export const createUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, addresses, age, phone } =
      filterBody(validUserKeys, req.body);
    const user = await User.create(
      {
        firstName,
        lastName,
        age,
        email,
        phone,
        password,
        addresses,
      },
      {
        include: [
          {
            association: User.Address,
            as: 'addresses',
          },
        ],
      }
    );

    const token = await User.generateAccessToken(req.body.email);
    const refreshToken = await User.generateRefreshToken(req.body.email);

    await redisClient.set(user.email, { refreshToken });

    res.status(201).send({
      ...user.dataValues,
      password: undefined,
      token,
      refreshToken,
    });
  } catch (error: any) {
    console.error(error);

    if (error.message.includes('Invalid request body key')) {
      res.status(400);
    } else {
      res.status(500);
    }

    res.send({
      message: error.message,
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = filterBody(['email', 'password'], req.body);
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Address,
          as: 'addresses',
        },
      ],
    });

    if (!user) {
      throw new Error('User not found.');
    }

    if (user.comparePassword(password)) {
      const token = await User.generateAccessToken(user.email);
      const refreshToken = await User.generateRefreshToken(user.email);

      await redisClient.set(user.email, { refreshToken });
      await User.update({ token }, { where: { id: user.id } });

      res.send({
        ...user.dataValues,
        password: undefined,
        token,
        refreshToken,
      });
    } else {
      throw new Error('Password is not correct.');
    }
  } catch (error: any) {
    console.error(error);

    if (error.message.includes('User not found')) {
      res.status(404);
    } else if (error.message.includes('Password is not correct')) {
      res.status(401);
    } else if (error.message.includes('Invalid request body key')) {
      res.status(400);
    } else {
      res.status(500);
    }

    res.send({ message: error.message });
  }
};

export const getUser = (req: Request, res: Response) => {
  const user = req.authUser;
  res.send({ ...user.dataValues });
};

export const updateUser = async (req: Request, res: Response) => {
  const authUser = req.authUser;

  try {
    filterBody(validUserKeys, req.body);

    if (req.body.email) {
      throw new Error('Cannot change email.');
    }

    for (const key in req.body) {
      authUser[key] = req.body[key];
    }

    await authUser.save();

    res.send({ message: 'User updated successfully' });
  } catch (error: any) {
    console.error(error);

    if (
      error.message.includes('Invalid request body key') ||
      error.message.includes('Cannot change email')
    ) {
      res.status(400);
    } else {
      res.status(500);
    }

    res.send({ message: error.message });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  const authUser = req.authUser;

  try {
    await redisClient.del(authUser.email);

    res.send({ message: 'User logout successfully' });
  } catch (error: any) {
    console.error(error);

    res.status(500).send({
      message: error.message,
    });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = filterBody(['refreshToken'], req.body);
    const decoded = await jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string
    );

    const { userEmail } = (<any>decoded).userEmail;

    const { refreshToken: storedToken } = await redisClient.get(userEmail);
    if (storedToken !== refreshToken) {
      throw new Error('Token is invalid.');
    }

    const token = await User.generateAccessToken(userEmail);
    const newRefreshToken = await User.generateRefreshToken(userEmail);
    await redisClient.set(userEmail, { refreshToken: newRefreshToken });
    res.send({ token, refreshToken: newRefreshToken });
  } catch (error: any) {
    console.error(error);

    if (error.message.includes('Invalid request body key')) {
      res.status(400);
    } else {
      res.status(500);
    }

    res.send({ message: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const authUser = req.authUser;
  await redisClient.del(authUser.id);

  try {
    const num = await User.destroy({ where: { id: authUser.id } });

    if (num === 0) {
      throw new Error('No user found');
    }

    res.send({
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error(error);

    if (error.message.includes('No user found')) {
      res.status(404);
    } else {
      res.status(500);
    }

    res.send({ message: error.message });
  }
};

export const addAddress = async (req: Request, res: Response) => {
  const authUser = req.authUser;

  try {
    const { unit, road, city } = filterBody(validAddressKeys, req.body);
    await Address.create({ unit, road, city, userId: authUser.id });
    res.send({ message: 'Add address successfully' });
  } catch (error: any) {
    console.error(error);

    if (error.message.includes('Invalid request body key')) {
      res.status(400);
    } else {
      res.status(500);
    }

    res.send({ message: error.message });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  const id = req.params.id;
  const authUser = req.authUser;

  try {
    const num = await Address.destroy({ where: { id, userId: authUser.id } });

    if (num === 0) {
      throw new Error('Address not found');
    }

    res.send({ message: 'Delete address successfully' });
  } catch (error: any) {
    console.error(error);

    if (error.message.includes('Address not found')) {
      res.status(404);
    } else {
      res.status(500);
    }
    res.send({ message: error.message });
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  const id = req.params.id;
  const authUser = req.authUser;

  try {
    filterBody(validAddressKeys, req.body);

    await Address.update(
      { ...req.body },
      { where: { id, userId: authUser.id } }
    );
    res.send({ message: 'Update address successfully' });
  } catch (error: any) {
    console.error(error);

    if (error.message.includes('Invalid request body key')) {
      res.status(400);
    } else {
      res.status(500);
    }

    res.send({ message: error.message });
  }
};
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: {
        exclude: ['password'],
      },
    });

    res.send(users);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
};

export const createUserByAdmin = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      role,
      email,
      password,
      addresses,
      age,
      phone,
    } = filterBody(validUserKeys, req.body);
    const user = await User.create(
      {
        firstName,
        lastName,
        age,
        email,
        role,
        phone,
        password,
        addresses,
      },
      {
        include: [
          {
            association: User.Address,
            as: 'addresses',
          },
        ],
      }
    );

    const token = await User.generateAccessToken(req.body.email);
    const refreshToken = await User.generateRefreshToken(req.body.email);

    await redisClient.set(user.email, { refreshToken });

    res.status(201).send({
      ...user.dataValues,
      password: undefined,
      token,
      refreshToken,
    });
  } catch (error: any) {
    console.error(error);

    if (error.message.includes('Invalid request body key')) {
      res.status(400);
    } else {
      res.status(500);
    }

    res.send({
      message: error.message,
    });
  }
};

export const deleteUserById = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const num = await User.destroy({ where: { id } });

    if (num === 0) {
      throw new Error('No user to delete');
    }

    res.send({ message: 'Delete user successfully' });
  } catch (error: any) {
    console.error(error);

    if (error.message.includes('No user to delete')) {
      res.status(404);
    } else {
      res.status(500);
    }

    res.send({ message: error.message });
  }
};

export const updateUserById = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    filterBody(validUserKeys, req.body);

    await User.update({ ...req.body }, { where: { id } });
    res.send({ message: 'Update user successfully' });
  } catch (error: any) {
    console.error(error);

    if (error.message.includes('Invalid request body key')) {
      res.status(400);
    } else {
      res.status(500);
    }

    res.send({ message: error.message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const user = await User.findOne(
      {
        attributes: {
          exclude: ['password'],
        },
      },
      { where: { id } }
    );

    if (!user) {
      throw new Error('User not found.');
    }

    res.send(user);
  } catch (error: any) {
    console.error(error);

    if (error.message.includes('User not found')) {
      res.status(404);
    } else {
      res.status(500);
    }

    res.send({ message: error.message });
  }
};

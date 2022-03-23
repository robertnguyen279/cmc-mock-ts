import filterBody from '../services/filterBody.service';
import db from '../models';
import { Request, Response } from 'express';
import { Transaction } from 'sequelize';

const { Order, Pet, sequelize } = db;

const validOrderKeys = ['petId', 'quantity', 'shipDate'];

export const placeOrder = async (req: Request, res: Response) => {
  const authUser = req.authUser;
  try {
    const result = await sequelize.transaction(async (t: Transaction) => {
      const { petId, quantity, shipDate } = filterBody(
        validOrderKeys,
        req.body
      );

      const pet = await Pet.findByPk(petId);

      if (pet.status !== 'available') {
        throw new Error('Pet is not available');
      }

      const order = await Order.create(
        {
          petId,
          quantity,
          shipDate,
          userId: authUser.id,
          status: 'placed',
          complete: false,
        },
        { transaction: t }
      );

      pet.status = 'pending';
      await pet.save({ transaction: t });

      return order;
    });

    res.status(201).send(result);
  } catch (error: any) {
    console.error(error);

    if (error.message.includes('Invalid request body key')) {
      res.status(400);
    } else if (error.message.includes('Pet is not available')) {
      res.status(404);
    } else {
      res.status(500);
    }

    res.send({ message: error.message, ...error });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const order = await Order.findByPk(id);

    if (!order) {
      throw new Error('Order not found');
    }

    res.send(order);
  } catch (error: any) {
    console.error(error);

    if (error.message.includes('Order not found')) {
      res.status(404);
    } else {
      res.status(500);
    }

    res.send({ message: error.message, ...error });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    await sequelize.transaction(async (t: Transaction) => {
      const order = await Order.findByPk(id);
      await Pet.update(
        { status: 'available' },
        { where: { id: order.petId }, transaction: t }
      );
      const num = await Order.destroy({ where: { id }, transaction: t });

      if (!num) {
        throw new Error('Order not found');
      }
    });

    res.send({ message: 'Delete order successfully' });
  } catch (error: any) {
    console.error(error);

    if (error.message.includes('Order not found')) {
      res.status(404);
    } else {
      res.status(500);
    }

    res.send({ message: error.message, ...error });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.findAll();
    res.send(orders);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    await sequelize.transaction(async (t: Transaction) => {
      const { status } = filterBody(validOrderKeys, req.body);

      const order = await Order.findByPk(id);
      const pet = await Pet.findByPk(order.petId);

      if (!order) {
        throw new Error('Order not found');
      }

      order.status = status;

      if (status === 'delivered') {
        order.complete = true;
        pet.status = 'sold';
      }

      await order.save({ transaction: t });
      await pet.save({ transaction: t });
    });

    res.send({ message: 'Order updated successfully' });
  } catch (error: any) {
    console.error(error);

    if (error.message.includes('Order not found')) {
      res.status(404);
    } else if (error.message.includes('Invalid request body key')) {
      res.status(400);
    } else {
      res.status(500);
    }

    res.send({ message: error.message, ...error });
  }
};

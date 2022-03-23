import express from 'express';
import authMiddleware from '../middlewares/auth.middleware';
import adminMiddleware from '../middlewares/admin.middleware';

const router = express.Router();

import {
  placeOrder,
  getOrderById,
  deleteOrder,
  updateOrderStatus,
  getAllOrders,
} from '../controllers/store.controller';

router.post('/orders', authMiddleware, placeOrder);
router.get('/orders', authMiddleware, adminMiddleware, getAllOrders);
router.get('/orders/:id', authMiddleware, adminMiddleware, getOrderById);
router.delete('/orders/:id', authMiddleware, adminMiddleware, deleteOrder);
router.put('/orders/:id', authMiddleware, adminMiddleware, updateOrderStatus);

export default router;

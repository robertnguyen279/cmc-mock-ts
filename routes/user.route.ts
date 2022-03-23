import express from 'express';
import authMiddleware from '../middlewares/auth.middleware';
import adminMiddleware from '../middlewares/admin.middleware';
const router = express.Router();

import {
  createUser,
  loginUser,
  getUser,
  updateUser,
  deleteUser,
  logoutUser,
  refreshToken,
  addAddress,
  deleteAddress,
  updateAddress,
  getAllUsers,
  getUserById,
  deleteUserById,
  updateUserById,
  createUserByAdmin,
} from '../controllers/user.controller';

router.post('/', createUser);
router.post('/login', loginUser);
router.post('/token', refreshToken);
router.get('/', authMiddleware, getUser);
router.put('/', authMiddleware, updateUser);
router.delete('/logout', authMiddleware, logoutUser);
router.delete('/', authMiddleware, deleteUser);
router.post('/addresses', authMiddleware, addAddress);
router.delete('/addresses/:id', authMiddleware, deleteAddress);
router.put('/addresses/:id', authMiddleware, updateAddress);
router.get('/getAllUsers', authMiddleware, adminMiddleware, getAllUsers);
router.get('/:id', authMiddleware, adminMiddleware, getUserById);
router.delete('/:id', authMiddleware, adminMiddleware, deleteUserById);
router.put('/:id', authMiddleware, adminMiddleware, updateUserById);
router.post('/admin', authMiddleware, adminMiddleware, createUserByAdmin);

export default router;

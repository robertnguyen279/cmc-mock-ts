import express from 'express';
import authMiddleware from '../middlewares/auth.middleware';
import adminMiddleware from '../middlewares/admin.middleware';
const router = express.Router();

import {
  createPet,
  getPet,
  getAllPets,
  updatePet,
  deletePet,
  getPetByStatus,
  uploadPetImages,
} from '../controllers/pet.controller';

router.post('/', authMiddleware, adminMiddleware, createPet);
router.post(
  '/:id/uploadImage',
  authMiddleware,
  adminMiddleware,
  uploadPetImages
);
router.get('/', getAllPets);
router.get('/findByStatus', getPetByStatus);
router.get('/:id', getPet);
router.put('/:id', authMiddleware, adminMiddleware, updatePet);
router.delete('/:id', authMiddleware, adminMiddleware, deletePet);

export default router;

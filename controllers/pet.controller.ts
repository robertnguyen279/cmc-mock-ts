import db from '../models';
import { v4 as uuid } from 'uuid';
import filterBody from '../services/filterBody.service';
import uploadFiles from '../services/multer.service';
import { Request, Response } from 'express';
import { Transaction } from 'sequelize';

const { Pet, Category, Pet_Tag, Tag, Photo, sequelize } = db;
const validPetKeys = ['category', 'name', 'tags', 'status', 'complete'];

export const createPet = async (req: Request, res: Response) => {
  try {
    const { category, name, tags, status } = filterBody(validPetKeys, req.body);
    const petId = uuid();

    if (!category) {
      throw new Error('Category must be specified');
    }

    const result = await sequelize.transaction(async (t: Transaction) => {
      const categoryIns = await Category.findOrCreate({
        where: { name: category },
        transaction: t,
      });

      const pet = await Pet.create(
        {
          id: petId,
          name,
          categoryId: categoryIns[0].id,
          status,
        },
        { transaction: t }
      );

      if (tags) {
        await Promise.all(
          tags.map(async (tag: string) => {
            const tagInc = await Tag.findOrCreate({
              where: { name: tag },
              transaction: t,
            });
            await Pet_Tag.findOrCreate({
              where: { petId, tagId: tagInc[0].id },
              transaction: t,
            });
          })
        );
      }
      return pet.id;
    });

    res.status(201).send({ message: 'Create pet successfully', petId: result });
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

export const getPet = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const pet = await Pet.findOne({
      where: { id },
      include: [
        {
          model: Category,
          as: 'category',
        },
        {
          model: Tag,
          as: 'tags',
          through: {
            attributes: [],
          },
        },
        {
          model: Photo,
          as: 'photos',
        },
      ],
      attributes: {
        exclude: ['categoryId'],
      },
    });

    if (!pet) {
      throw new Error('No pet found');
    }

    res.send(pet);
  } catch (error: any) {
    console.error(error);

    if (error.message.includes('No pet found')) {
      res.status(404);
    } else {
      res.status(500);
    }

    res.send({ message: error.message });
  }
};

export const getAllPets = async (req: Request, res: Response) => {
  try {
    const pets = await Pet.findAll({
      include: [
        {
          model: Category,
          as: 'category',
        },
        {
          model: Tag,
          as: 'tags',
          through: {
            attributes: [],
          },
        },
        {
          model: Photo,
          as: 'photos',
        },
      ],
      attributes: {
        exclude: ['categoryId'],
      },
    });

    res.send(pets);
  } catch (error: any) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
};

export const updatePet = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const result = await sequelize.transaction(async (t: Transaction) => {
      filterBody(validPetKeys, req.body);

      const pet = await Pet.findByPk(id);

      if (!pet) {
        throw new Error('No pet found');
      }

      for (const key in req.body) {
        pet[key] = req.body[key];
      }

      if (req.body.category) {
        const categoryIns = await Category.findOrCreate({
          where: { name: req.body.category },
          transaction: t,
        });

        pet.categoryId = categoryIns[0].id;
      }

      await pet.save({ transaction: t });

      if (req.body.tags) {
        await Pet_Tag.destroy({ where: { petId: pet.id }, transaction: t });
        await Promise.all(
          req.body.tags.map(async (tag: string) => {
            const tagInc = await Tag.findOrCreate({
              where: { name: tag },
              transaction: t,
            });

            await Pet_Tag.findOrCreate({
              where: { petId: pet.id, tagId: tagInc[0].id },
              transaction: t,
            });
          })
        );
      }

      return pet.id;
    });

    res.send({ message: 'Update pet successfully', petId: result });
  } catch (error: any) {
    console.error(error);

    if (error.message.includes('Invalid request body key')) {
      res.status(400);
    } else if (error.message.includes('No pet found')) {
      res.status(404);
    } else {
      res.status(500);
    }

    res.send({ message: error.message });
  }
};

export const deletePet = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const num = await Pet.destroy({ where: { id, status: 'available' } });

    if (!num) {
      throw new Error('Pet not found or not available');
    }

    res.send({ message: 'Delete pet successfully' });
  } catch (error: any) {
    console.error(error);

    if (error.message.includes('Pet not found')) {
      res.status(404);
    } else {
      res.status(500);
    }

    res.send({ message: error.message });
  }
};

export const getPetByStatus = async (req: Request, res: Response) => {
  try {
    const status = req.query.status;

    if (!status) {
      throw new Error('Status must be specified');
    }

    const pets = await Pet.findAll({
      where: { status },
      include: [
        {
          model: Category,
          as: 'category',
        },
        {
          model: Tag,
          as: 'tags',
        },
        {
          model: Photo,
          as: 'photos',
        },
      ],
      attributes: {
        exclude: ['categoryId'],
      },
    });

    res.send(pets);
  } catch (error: any) {
    console.error(error);

    if (error.message.includes('Status must be specified')) {
      res.status(400);
    } else {
      res.status(500);
    }

    res.send({ message: error.message });
  }
};

export const uploadPetImages = async (req: Request, res: Response) => {
  uploadFiles(req, res, async (err: any) => {
    try {
      if (err) {
        throw new Error(err);
      }

      const id = req.params.id;
      const pet = await Pet.findByPk(id);

      if (!req.files || !req.files.length) {
        throw new Error('Images must be provided');
      }

      const photos = req.files.map((file: any) => {
        return {
          petId: pet.id,
          url: `/images/${file.filename}`,
        };
      });

      const photosIns = await Photo.bulkCreate(photos);

      res.send(photosIns);
    } catch (error: any) {
      console.error(error);

      res.status(500).send({ message: error.message });
    }
  });
};

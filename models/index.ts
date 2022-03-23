'use strict';

const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db: any = {};

import Address from './address.model';
import Category from './category.model';
import Order from './order.model';
import Pet_Tag from './pet_tag.model';
import Photo from './photo.model';
import User from './user.model';
import Pet from './pet.model';
import Tag from './tag.model';

let sequelize: any;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

db.User = User(sequelize, Sequelize.DataTypes);
db.Pet = Pet(sequelize, Sequelize.DataTypes);
db.Category = Category(sequelize, Sequelize.DataTypes);
db.Tag = Tag(sequelize, Sequelize.DataTypes);
db.Order = Order(sequelize, Sequelize.DataTypes);
db.Photo = Photo(sequelize, Sequelize.DataTypes);
db.Address = Address(sequelize, Sequelize.DataTypes);
db.Pet_Tag = Pet_Tag(sequelize, Sequelize.DataTypes);

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;

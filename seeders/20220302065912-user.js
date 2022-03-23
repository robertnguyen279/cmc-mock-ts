'use strict';
const { v4: uuid } = require('uuid');
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    return queryInterface.bulkInsert(
      'Users',
      [
        {
          firstName: 'Van Phuong',
          lastName: 'Nguyen',
          age: 25,
          id: uuid(),
          email: 'phuong09021998@gmail.com',
          password: bcrypt.hashSync('phuong9823'),
          role: 'admin',
          phone: '123456',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return queryInterface.bulkDelete('Users', null, {});
  },
};

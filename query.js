const { User, Address } = require('./models');
const Sequelize = require('sequelize');

// Find all users with their associated tasks
// Raw SQL: SELECT * FROM "Users" JOIN "Tasks" ON "Tasks"."userId" = "Users".id;

const findAllWithTasks = async () => {
  const users = await User.findAll({
    include: [
      {
        model: Address,
      },
    ],
  });
  console.log(
    'All users with their associated addresses:',
    JSON.stringify(users, null, 4)
  );
};

const run = async () => {
  await findAllWithTasks();
  await process.exit();
};

run();

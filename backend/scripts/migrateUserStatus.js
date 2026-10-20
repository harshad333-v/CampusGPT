require("dotenv").config();

const connectDB = require("../src/config/database");
const User = require("../src/models/User");

const migrateUserStatus = async () => {
  try {
    await connectDB();

    const result = await User.updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } }
    );

    console.log(
      `Migration completed. ${result.modifiedCount} users updated.`
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "User status migration failed:",
      error.message
    );

    process.exit(1);
  }
};

migrateUserStatus();
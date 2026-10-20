const User = require("../models/User");
const Department = require("../models/Department");
const bcrypt = require("bcryptjs");

const createUserService = async ({
  name,
  email,
  password,
  role,
  department,
  studentId,
  employeeId,
}) => {
  if (!name || !email || !password || !role) {
    throw new Error("All required fields must be provided");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("User already exists");
  }

  if (role === "student") {
    if (!studentId) {
      throw new Error("Student ID is required for students");
    }

    if (!department) {
      throw new Error("Department is required for students");
    }
  }

  if (role === "teacher") {
    if (!employeeId) {
      throw new Error("Employee ID is required for teachers");
    }

    if (!department) {
      throw new Error("Department is required for teachers");
    }
  }

  if (department) {
    const departmentExists = await Department.findById(
      department
    );

    if (!departmentExists) {
      throw new Error("Invalid department");
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    passwordHash: hashedPassword,
    role,

    department:
      role === "student" || role === "teacher"
        ? department
        : null,

    studentId:
      role === "student" ? studentId : null,

    employeeId:
      role === "teacher" ? employeeId : null,
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    studentId: user.studentId,
    employeeId: user.employeeId,
  };
};

const getAllUsersService = async () => {
  return await User.find()
    .populate("department", "name code")
    .select("-passwordHash");
};

const getUserByIdService = async (id) => {
  const user = await User.findById(id)
    .populate("department", "name code")
    .select("-passwordHash");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

const updateUserService = async (id, data) => {
  // Account status must only be changed
  // through the dedicated status endpoint.
  if (Object.prototype.hasOwnProperty.call(data, "isActive")) {
    throw new Error(
      "Account status must be updated through the status endpoint."
    );
  }

  if (data.department) {
    const departmentExists = await Department.findById(
      data.department
    );

    if (!departmentExists) {
      throw new Error("Invalid department");
    }
  }

  const user = await User.findByIdAndUpdate(
    id,
    data,
    {
      returnDocument: "after",
      runValidators: true,
    }
  )
    .populate("department", "name code")
    .select("-passwordHash");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

const deleteUserService = async (id) => {
  const user = await User.findByIdAndDelete(id);

  if (!user) {
    throw new Error("User not found");
  }

  return {
    message: "User deleted successfully",
  };
};

// Activate or deactivate a user account
const updateUserStatusService = async (id, isActive) => {
  if (typeof isActive !== "boolean") {
    throw new Error("isActive must be a boolean");
  }

  const user = await User.findByIdAndUpdate(
    id,
    { isActive },
    {
      returnDocument: "after",
      runValidators: true,
    }
  )
    .populate("department", "name code")
    .select("-passwordHash");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

module.exports = {
  createUserService,
  getAllUsersService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
  updateUserStatusService,
};
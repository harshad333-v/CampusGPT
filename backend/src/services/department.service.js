const Department = require("../models/Department");

const createDepartmentService = async (data) => {
  return await Department.create(data);
};

const getAllDepartmentsService = async () => {
  return await Department.find({ isActive: true })
    .sort({ name: 1 });
};

const getDepartmentByIdService = async (id) => {
  const department = await Department.findById(id);

  if (!department) {
    throw new Error("Department not found");
  }

  return department;
};

module.exports = {
  createDepartmentService,
  getAllDepartmentsService,
  getDepartmentByIdService,
};
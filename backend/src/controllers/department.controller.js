const {
  createDepartmentService,
  getAllDepartmentsService,
  getDepartmentByIdService,
} = require("../services/department.service");

const createDepartment = async (req, res) => {
  try {
    const department =
      await createDepartmentService(req.body);

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: department,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllDepartments = async (req, res) => {
  try {
    const departments =
      await getAllDepartmentsService();

    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const department =
      await getDepartmentByIdService(
        req.params.id
      );

    res.status(200).json({
      success: true,
      data: department,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
};
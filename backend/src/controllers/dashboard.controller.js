const {
  getDashboardService,
} = require("../services/dashboard.service");


const getDashboard = async (req, res) => {
  try {
    const dashboard = await getDashboardService(req.user.id);

    return res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    let statusCode = 500;

    if (error.message === "User not found") {
      statusCode = 404;
    }

    if (error.message === "Access denied") {
      statusCode = 403;
    }

    if (error.message === "Invalid user role") {
      statusCode = 403;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  getDashboard,
};
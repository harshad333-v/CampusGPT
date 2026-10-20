const {
  processBulkRegistration,
} = require("../services/bulkRegistration.service");

const bulkRegisterUsers = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "CSV file is required.",
    });
  }

  try {
    const results = await processBulkRegistration(
      req.file.buffer
    );

    return res.status(200).json({
      success: true,
      message: "Bulk registration processed.",
      data: results,
    });
  } catch (error) {
    console.error("Bulk registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process bulk registration.",
      error: error.message,
    });
  }
};

module.exports = {
  bulkRegisterUsers,
};
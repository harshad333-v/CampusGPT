const {
  createNotificationService,
  getAllNotificationsService,
  getNotificationByIdService,
  updateNotificationService,
  deleteNotificationService,
} = require("../services/notification.service");
const createNotification = async (req, res) => {
  try {
    const notification =
      await createNotificationService({
        ...req.body,
        createdBy: req.user.id,
      });

    return res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllNotifications = async (req, res) => {
  try {
    const notifications =
  await getAllNotificationsService(
    req.user.role
  );

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getNotificationById = async (req, res) => {
  try {
    const notification =
      await getNotificationByIdService(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const updateNotification = async (req, res) => {
  try {
    const notification =
      await updateNotificationService(
        req.params.id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message: "Notification updated successfully",
      data: notification,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const result =
      await deleteNotificationService(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
deleteNotification,
};
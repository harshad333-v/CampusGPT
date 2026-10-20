const Notification = require("../models/Notification");

const createNotificationService = async ({
  title,
  message,
  targetRole,
  createdBy,
}) => {
  const notification = await Notification.create({
    title,
    message,
    targetRole,
    createdBy,
  });

  return notification;
};

const getAllNotificationsService = async (userRole) => {
  let filter = {};

  if (userRole !== "admin") {
    filter = {
      targetRole: {
        $in: ["ALL", userRole],
      },
    };
  }

  return await Notification.find(filter)
    .populate("createdBy", "name email role")
    .sort({ createdAt: -1 });
};

const getNotificationByIdService = async (id) => {
  const notification = await Notification.findById(id)
    .populate("createdBy", "name email role");

  if (!notification) {
    throw new Error("Notification not found");
  }

  return notification;
};

const updateNotificationService = async (id, data) => {
 const notification = await Notification.findByIdAndUpdate(
  id,
  data,
  {
    returnDocument: "after",
    runValidators: true,
  }
);

  if (!notification) {
    throw new Error("Notification not found");
  }

  return notification;
};

const deleteNotificationService = async (id) => {
  const notification =
    await Notification.findByIdAndDelete(id);

  if (!notification) {
    throw new Error("Notification not found");
  }

  return {
    message: "Notification deleted successfully",
  };
};

module.exports = {
  createNotificationService,
  getAllNotificationsService,
  getNotificationByIdService,
  updateNotificationService,
deleteNotificationService,
};
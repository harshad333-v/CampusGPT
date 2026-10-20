const User = require("../models/User");
const Department = require("../models/Department");
const Document = require("../models/Document");
const Notification = require("../models/Notification");


// ===============================
// STUDENT DASHBOARD
// ===============================

const getStudentDashboardService = async (userId) => {
  const user = await User.findById(userId)
    .select("-passwordHash")
    .populate("department", "name code description");

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "student") {
    throw new Error("Access denied");
  }

  // Find COMMON department
  const commonDepartment = await Department.findOne({
    code: "COMMON",
    isActive: true,
  });

  // Student can see documents from:
  // 1. Their own department
  // 2. COMMON department
  const departmentIds = [];

  if (user.department?._id) {
    departmentIds.push(user.department._id);
  }

  if (commonDepartment?._id) {
    departmentIds.push(commonDepartment._id);
  }

  const [recentDocuments, recentNotifications] =
    await Promise.all([
      Document.find({
        department: {
          $in: departmentIds,
        },
        visibility: "PUBLIC",
        isActive: true,
      })
        .populate("department", "name code")
        .populate("uploadedBy", "name email role")
        .sort({ createdAt: -1 })
        .limit(5),

      Notification.find({
        targetRole: {
          $in: ["ALL", "student"],
        },
        isActive: true,
      })
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
    },

    department: user.department,

    recentDocuments,

    recentNotifications,
  };
};


// ===============================
// TEACHER DASHBOARD
// ===============================

const getTeacherDashboardService = async (userId) => {
  const user = await User.findById(userId)
    .select("-passwordHash")
    .populate("department", "name code description");

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "teacher") {
    throw new Error("Access denied");
  }

  const [
    uploadedDocuments,
    recentNotifications,
    uploadedDocumentCount,
  ] = await Promise.all([
    Document.find({
      uploadedBy: userId,
      isActive: true,
    })
      .populate("department", "name code")
      .sort({ createdAt: -1 })
      .limit(5),

    Notification.find({
      targetRole: {
        $in: ["ALL", "teacher"],
      },
      isActive: true,
    })
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .limit(5),

    Document.countDocuments({
      uploadedBy: userId,
      isActive: true,
    }),
  ]);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    },

    department: user.department,

    uploadedDocuments,

    recentNotifications,

    statistics: {
      uploadedDocuments: uploadedDocumentCount,
    },
  };
};


// ===============================
// ADMIN DASHBOARD
// ===============================

const getAdminDashboardService = async (userId) => {
  const user = await User.findById(userId)
    .select("-passwordHash");

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "admin") {
    throw new Error("Access denied");
  }

  const [
    totalStudents,
    totalTeachers,
    totalDepartments,
    totalDocuments,
    recentDocuments,
    recentNotifications,
  ] = await Promise.all([
    User.countDocuments({
      role: "student",
    }),

    User.countDocuments({
      role: "teacher",
    }),

    Department.countDocuments({
      isActive: true,
    }),

    Document.countDocuments({
      isActive: true,
    }),

    Document.find({
      isActive: true,
    })
      .populate("department", "name code")
      .populate("uploadedBy", "name email role")
      .sort({ createdAt: -1 })
      .limit(5),

    Notification.find({
      targetRole: {
        $in: ["ALL", "admin"],
      },
      isActive: true,
    })
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },

    statistics: {
      totalStudents,
      totalTeachers,
      totalDepartments,
      totalDocuments,
    },

    recentDocuments,

    recentNotifications,
  };
};


// ===============================
// MAIN DASHBOARD SERVICE
// ===============================

const getDashboardService = async (userId) => {
  const user = await User.findById(userId)
    .select("role");

  if (!user) {
    throw new Error("User not found");
  }

  switch (user.role) {
    case "student":
      return await getStudentDashboardService(userId);

    case "teacher":
      return await getTeacherDashboardService(userId);

    case "admin":
      return await getAdminDashboardService(userId);

    default:
      throw new Error("Invalid user role");
  }
};


module.exports = {
  getDashboardService,
  getStudentDashboardService,
  getTeacherDashboardService,
  getAdminDashboardService,
};
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    studentId: {
      type: String,
      default: null,
    },

    employeeId: {
      type: String,
      default: null,
    },

    mustChangePassword: {
      type: Boolean,
      default: true,
    },

    // Account status managed by admin
    isActive: {
      type: Boolean,
      default: true,
    },

    passwordResetToken: {
      type: String,
      default: null,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
    },

    preferences: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
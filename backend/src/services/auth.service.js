const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/email");

const registerUserService = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    throw new Error("All fields are required");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    passwordHash: hashedPassword,
  });

  const safeUser = await User.findById(user._id);

  return safeUser;
};

const loginUserService = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Check whether the account has been deactivated by an admin
  if (user.isActive === false) {
    throw new Error(
      "Your account has been deactivated. Please contact the administrator."
    );
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  const safeUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    studentId: user.studentId,
    employeeId: user.employeeId,
  };

  return {
    token,
    mustChangePassword: user.mustChangePassword,
    user: safeUser,
  };
};

const changePasswordService = async (
  userId,
  { currentPassword, newPassword }
) => {
  if (!currentPassword || !newPassword) {
    throw new Error(
      "Current password and new password are required"
    );
  }

  const user = await User.findById(userId).select(
    "+passwordHash"
  );

  if (!user) {
    throw new Error("User not found");
  }

  const isPasswordValid = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!isPasswordValid) {
    throw new Error("Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    10
  );

  user.passwordHash = hashedPassword;
  user.mustChangePassword = false;

  await user.save();

  return {
    message: "Password changed successfully",
  };
};

const forgotPasswordService = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  const resetToken = crypto
    .randomBytes(32)
    .toString("hex");

  user.passwordResetToken = resetToken;
  user.passwordResetExpires =
    Date.now() + 15 * 60 * 1000;

  await user.save();

  const resetUrl =
    `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const message = `
    <h2>CampusGPT Password Reset</h2>
    <p>Hello ${user.name},</p>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}">
      Reset Password
    </a>
    <p>This link will expire in 15 minutes.</p>
  `;

  console.log("Sending email to:", user.email);

  await sendEmail({
    email: user.email,
    subject: "CampusGPT Password Reset",
    message,
  });

  return {
    message:
      "Password reset link sent successfully",
  };
};

const resetPasswordService = async (
  token,
  newPassword
) => {
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: {
      $gt: Date.now(),
    },
  }).select("+passwordHash");

  if (!user) {
    throw new Error(
      "Invalid or expired reset token"
    );
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    10
  );

  user.passwordHash = hashedPassword;
  user.mustChangePassword = false;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;

  await user.save();

  return {
    message: "Password reset successful",
  };
};

module.exports = {
  registerUserService,
  loginUserService,
  changePasswordService,
  forgotPasswordService,
  resetPasswordService,
};
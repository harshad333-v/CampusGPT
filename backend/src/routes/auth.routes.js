const express = require("express");
const router = express.Router();

const {
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");

const {
  authenticate,
} = require("../middleware/auth.middleware");

router.post("/login", loginUser);

router.post(
  "/change-password",
  authenticate,
  changePassword
);
router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/reset-password",
  resetPassword
);


module.exports = router;
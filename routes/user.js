import express from "express";
import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.js";

import {
  register,
  verify,
  login,
  logout,
  addTask,
  getTasks,
  removeTask,
  updateTask,
  updateProfile,
  getProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/user.js";

const router = Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/verify").post(isAuthenticated, verify);
router.route("/logout").get(isAuthenticated, logout);
router.route("/updateProfile").put(isAuthenticated, updateProfile);
router.route("/me").get(isAuthenticated, getProfile);
router.route("/changePassword").put(isAuthenticated, changePassword);
router.route("/forgotPassword").post(forgotPassword);
router.route("/resetPassword").put(resetPassword);
router.route("/addTask").post(isAuthenticated, addTask);
router.route("/getTasks").get(isAuthenticated, getTasks);
router.route("/removeTask/:taskId").delete(isAuthenticated, removeTask);
router.route("/updateTask/:taskId").put(isAuthenticated, updateTask);

export default router;

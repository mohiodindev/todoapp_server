import { User } from "../models/user.js";
import moment from "moment";
import cloudinary from "cloudinary";
import fs from "fs";
import { sendMail, sendToken } from "../utils/utils.js";

// @route   POST api/users/register
// @desc    Register user
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const avatar = req.files.avatar.tempFilePath;

    // upload avatar to cloudinary

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const otp = Math.floor(Math.random() * 1000000);

    const myCloud = await cloudinary.v2.uploader.upload(avatar, {
      folder: "todoapp",
    });

    // delete tmp folder after upload
    fs.rmSync("./tmp", { recursive: true });
    // Create a new user
    user = await User.create({
      name,
      email,
      password,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
      otp,
      otp_expiry: moment().add(1, "hours"),
    });

    await sendMail(email, "Verify your account", `Your OTP is ${otp}`);
    sendToken(
      res,
      user,
      201,
      "otp sent to your email please verify your account"
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   POST api/users/verify
// @desc    Verify user
// @access  Public
export const verify = async (req, res) => {
  try {
    const otp = req.body.otp;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User does not exist",
      });
    }
    if (user.otp !== otp || user.otp_expiry < moment()) {
      return res.status(400).json({
        success: false,
        message: "OTP is incorrect or expired",
      });
    }
    user.verified = true;
    user.otp = "";
    user.otp_expiry = "";
    await user.save();

    sendToken(res, user, 200, "User verified");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   POST api/users/login
// @desc    Login user
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter all fields",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "invalid credentials",
      });
    }
    sendToken(res, user, 200, "Login successful");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// logout
export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// add task
export const addTask = async (req, res) => {
  try {
    const { title, description } = req.body;
    const user = await User.findById(req.user._id);
    user.tasks.push({
      title,
      description,
      completed: false,
      createdAt: new Date(),
    });

    await user.save();
    res.status(200).json({
      success: true,
      message: "Task added successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get tasks
export const getTasks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: user.tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// remove task
export const removeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const user = await User.findById(req.user._id);
    const task = user.tasks.find(
      (task) => task._id.toString() === taskId.toString()
    );
    if (!task) {
      return res.status(400).json({
        success: false,
        message: "Task does not exist",
      });
    }
    user.tasks.pull(task);
    await user.save();
    res.status(200).json({
      success: true,
      message: "Task removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// update task as completed
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const user = await User.findById(req.user._id);
    const task = user.tasks.find(
      (task) => task._id.toString() === taskId.toString()
    );
    if (!task) {
      return res.status(400).json({
        success: false,
        message: "Task does not exist",
      });
    }
    task.completed = !task.completed;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Task updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const avatar = req.files.avatar.tempFilePath;
    const user = await User.findById(req.user._id);
    // check if user verified
    if (!user.verified) {
      return res.status(400).json({
        success: false,
        message: "User not verified",
      });
    }
    if (name) {
      user.name = name;
    }

    // upload image to cloudinary
    if (avatar) {
      await cloudinary.v2.uploader.destroy(user.avatar.public_id);
      const myCloud = await cloudinary.v2.uploader.upload(avatar, {
        folder: "todoapp",
      });

      user.avatar.url = myCloud.secure_url;
      user.avatar.public_id = myCloud.public_id;
    }
    fs.rmSync("./tmp", { recursive: true });

    await user.save();
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get my profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    sendToken(res, user, 200, `Welcome Back ${user.name}`);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// change password
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please enter all fields",
      });
    }
    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User does not exist",
      });
    }
    const resetPasswordOtp = Math.floor(Math.random() * 100000);
    user.resetPasswordOtp = resetPasswordOtp;
    user.resetPasswordOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    const message = `Your OTP is ${resetPasswordOtp} if you want to reset your password, please enter this OTP in the app or if you didn't request for this, please ignore this email.`;
    await sendMail(email, "Reset Password", message);
    res.status(200).json({
      success: true,
      message: `Reset Password OTP sent to your email ${email}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// reset password
export const resetPassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    if (!otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please enter all fields",
      });
    }
    const user = await User.findOne({
      resetPasswordOtp: otp,
      resetPasswordOtpExpiry: { $gt: new Date() },
    }).select("+password");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid or expired",
      });
    }
    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpiry = null;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

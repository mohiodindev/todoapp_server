import { createTransport } from "nodemailer";

export const sendMail = async (email, subject, text) => {
  try {
    const transport = createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    await transport.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject,
      text,
    });
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

// genrate json web token
export const sendToken = (res, user, statusCode, message) => {
  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    tasks: user.tasks,
    verified: user.verified,
  };
  const token = user.getJwtToken();

  res
    .status(statusCode)
    .cookie("token", token, {
      expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    })
    .json({
      success: true,
      message,
      user: userData,
    });
};

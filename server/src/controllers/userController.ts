import bcrypt from "bcryptjs";
import { CookieOptions, Request, Response } from "express";
import prisma from "../prisma";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import generateAuthTokens from "../utils/generateAuthTokens";
import { hashPassword } from "../utils/hashPassword";

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, username, password } = req.body;

  if ([name, email, username, password].some((field) => field?.trim() === "")) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      username,
      password: hashedPassword,
    },
  });

  const createdUser = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
  });

  if (!createdUser) {
    return res.status(500).json({ message: "User not created" });
  }

  return res.status(201).json({ user: createdUser });
});

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (!user) throw new ApiError(404, "User not found");

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) throw new ApiError(401, "Invalid password");

  const { accessToken, refreshToken } = await generateAuthTokens(user.id);

  const loggedInUser = await prisma.user.findFirst({
    where: {
      id: user.id,
    },
  });

  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }))
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions);
});

export { loginUser, registerUser };

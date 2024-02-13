import { User } from "@prisma/client";
import jwt from "jsonwebtoken";
import prisma from "../prisma";
import { ApiError } from "./ApiError";

export default async function generateAuthTokens(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    const accessToken = generateAccessToken(user as User);
    const refreshToken = generateRefreshToken(user as User);

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshToken,
      },
    });

    return { accessToken, refreshToken };
  } catch (error: any) {
    throw new ApiError(500, error.message || "An error occurred while generating auth tokens");
  }
}

function generateAccessToken(user: User) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    process.env.ACCESS_TOKEN_SECRET as string,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
}

function generateRefreshToken(user: User) {
  return jwt.sign(
    {
      id: user.id,
    },
    process.env.REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
}

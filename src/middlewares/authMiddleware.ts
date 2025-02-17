import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import User from "../models/userModel.js";




const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token = req?.cookies?.jwtGadgetToken;
  
  if (!token) {
    res.status(401).json({ message: "Unauthorized. Log in to continue" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = await User.findById(decoded.userId).select("-password");

    if (!req.user) {
      res.status(401).json({ message: "Not authorized, user not found" });
      return;
    }

    console.log("User is authenticated with JWT");
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ message: "Not authorized, token failed" });
    return;
  }
};

const ensureGuest = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.jwtGadgetToken;

  if (token) {
    res.status(400).json({ message: "You are already logged in. You need to be a guest." });
    return;
  }

  console.log("User is not authenticated");
  next();
};




// Function to check if a string is a valid MongoDB ObjectId
const isValidObjectId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

const validateId = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  
  if (!isValidObjectId(id)) {
    res.status(400).json({ message: "Invalid ObjectId" });
    return;
  }

  console.log("Object id is valid");
  next();
};

export { protect,  ensureGuest, validateId };

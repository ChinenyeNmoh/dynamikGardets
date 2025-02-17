import { Request, Response, NextFunction,ErrorRequestHandler } from "express";

// Custom error page for not found URLs
const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Custom error handler middleware
// Custom error handler middleware
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found";
  }

  // Handle Mongoose ValidationError
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors)
      .map((error: any) => error.message)
      .join(" ");
    return res.status(400).json({
      status: "fail",
      message: `${errors}`,
    });
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack, // Hide stack trace in production
  });
};

export { notFound, errorHandler };

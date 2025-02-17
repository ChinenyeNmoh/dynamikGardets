import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";

// Define an interface for the User document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  lastEmailSent?: Date | null;
  verificationToken?: string;
  passwordResetToken?: string;
  address?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  isPasswordMatch(enteredPassword: string): Promise<boolean>;
}

// User Schema Definition
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      validate: {
        validator: function (str: string) {
            return validator.isEmail(str);
        },
        message: "{VALUE} is not a valid email address",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    
    lastEmailSent: {
      type: Date,
      default: null,
    },
    verificationToken: {
      type: String,
    },
    passwordResetToken: {
      type: String,
    },
    
    address: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    
  },
  {
    timestamps: true,
  }
);


// Pre-save Middleware to Hash Password
userSchema.pre<IUser>("save", async function (next) {
  try {
    if (!this.isModified("password")) {
      return next();
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Custom Method to Compare Passwords
userSchema.methods.isPasswordMatch = async function (
  enteredPassword: string
): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.password);
};

// Export the User model
export default model<IUser>("User", userSchema);

import { Request,Response } from "express";
import User from "../models/userModel.js";
import { v4 as uuidv4 } from 'uuid';
import { emailVerificationTemplate, sendEmail, passwordResetTemplate } from "../utils/mail.js";
import Token from '../models/tokenModel.js';
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

// Register a new user
const registerUser = async (req: Request, res: Response): Promise<void>  => {
    try {
        // Extract user data from request body
        const { name, email, password, confirmPassword, address } = req.body as {
            name: string;
            email: string;
            password: string;
            confirmPassword: string;
            address: string;
        };

        // Validate input fields
        if (!name || !email || !password || !confirmPassword || !address) {
            res.status(400).json({ message: "Please fill in all fields" });
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            res.status(400).json({ message: "Passwords do not match" });
            return;
        }

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }
        const newUser = await new User({ name, email, password, address }).save();
    
        const token = await new Token({
            userId: newUser._id,
            token: uuidv4(),
            type: "verification",
        }).save()


        // Generate an email verification link
        const link = `${process.env.BASE_URL}/verify/${newUser._id}/${token.token}`;
    
        // Send the email verification link
        const htmlContent = emailVerificationTemplate(link, newUser);
        await sendEmail(newUser.email, "Email Verification", htmlContent);
    
        res.status(201).json({ message: "User registered successfully. Please check your email to verify your account." });
        return;
    }catch(error: any){
        console.error(error);
        res.status(500).json({ message: error.message });
    }
    
};

// Verify user's email
const verifyToken = async (req: Request, res: Response): Promise<void>  => {
    const { id, token } = req.params as {
        id:string;
        token:string
    };
    console.log(token)
  
    const user = await User.findById(id);
  
    if (!user) {
        res.status(400).json({message: "User not found" });
        return;
    }
  
    const userToken = await Token.findOne({
      userId: user._id,
      token: token,
      type: "verification",
    });
  
    if (!userToken) {
        res.status(400).json({ message: "Invalid or expired token" });
        return;
    }
  
    // Token is valid, update the user and delete the token
    await User.findByIdAndUpdate(
      id,
      { isVerified: true },
      { new: true }
    );
  
    await Token.findByIdAndDelete(userToken._id);
    res.status(200).json({ message: "User verified successfully" });
  };


// Login user
const loginUser =async (req: Request, res: Response): Promise<void>  => {
    const { email, password } = req.body as {
        email: string;
        password: string;
    };
    try{

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
    }

    // Check if the password matches
    const isMatch = await user.isPasswordMatch(password);
    if (!isMatch) {
       res.status(401).json({ message: "Invalid credentials" });
       return;
    }

    // Check if the user is verified
    if (!user.isVerified) {
        const tokenUser = await Token.findOne({ userId: user._id, type: 'verification' });

        if (tokenUser) {
            res.status(401).json({ message: "User is not verified. Check your email for the verification link." });
            return;
        } else {
            // Create a new token for the user
            const token = await new Token({
                userId: user._id,
                token: uuidv4(),
                type: 'verification',
            }).save();

            const link = `${process.env.BASE_URL}/verify/${user._id}/${token.token}`;
            const htmlContent = emailVerificationTemplate(link, user);

            // Send the verification email
            await sendEmail(user.email, 'Account Verification', htmlContent);

            console.log('Verification email sent');
            res.status(401).json({ message: "User is not verified. Check your email for the verification link." });
            return;
        }
    }

    // Generate and send JWT token
    generateToken(res, user._id);

    const responseUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
       
    }
    console.log(responseUser);
    // Send success response
    res.status(200).json({ message: "User logged in successfully", user: responseUser });
    return;
}catch(error: any){
    console.error(error);
    res.status(500).json({ message: error.message });
}
};



// Request password reset
const forgotPassword = async (req: Request, res: Response): Promise<void>  => {
    const { email } = req.body as {
        email: string;
    }
    try{
    if (!email) {
        res.status(400).json({ message: "Please provide your email address" });
        return;
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
        res.status(400).json({ message: "invalid credentials" });
        return;
    }

    // Check if user is verified
    if (!user.isVerified) {
        let tokenUser = await Token.findOne({ userId: user._id, type: 'verification' });

        if (tokenUser) {
           res.status(401).json({ message: "User is not verified. Check your email for the verification link." });
            return;
        }

        // Create a new verification token for the user if not verified
        const verificationToken = await new Token({
            userId: user._id,
            token: uuidv4(),
            type:'verification',
        }).save();

        const verificationLink = `${process.env.BASE_URL}/${user._id}/verify/${verificationToken.token}`;
        const htmlContent = emailVerificationTemplate(verificationLink, user);

        // Send the verification email
        await sendEmail(user.email, 'Account Verification', htmlContent);
        console.log('Verification email sent');
        res.status(401).json({ message: "User is not verified. Check your email for the verification link." });
        return;
    }

    // Check if there is an existing password reset token for the user
    let tokenUser = await Token.findOne({ userId: user._id, type: 'passwordReset' });

    if (tokenUser) {
        res.status(400).json({ message: "Password reset email already sent. Check your email for the reset link." });
        return;
    }
     // Check when the last email was sent
     const now = Date.now();
     const emailDelay = 15 * 60 * 1000; // 15 minutes

     if (user.lastEmailSent && (now - new Date(user.lastEmailSent).getTime()) < emailDelay) {
         res.status(400).json({ message: 'Too many requests. Try again later.' });
            return;
     }

    // Create a new password reset token for the user
    const passwordResetToken = await new Token({
        userId: user._id,
        token: uuidv4(),
        type: 'passwordReset',
    }).save();

    // Construct the password reset link
    const resetLink = `${process.env.BASE_URL}/resetpassword/${user._id}/${passwordResetToken.token}`;
    const htmlContent = passwordResetTemplate(resetLink, user);

    // Send the password reset email
    await sendEmail(user.email, 'Password Reset', htmlContent);
    user.lastEmailSent = new Date(now);
    await user.save();
    res.status(200).json({ message: 'Password reset email sent. Check your email for the reset link.' });
    return;
}catch(error: any){
    console.log('Password reset email sent');
    res.status(200).json({ message: error.message || "something went wrong" });
    return;
}
};


// Reset user's password
const resetPassword = async (req: Request, res: Response): Promise<void>  => {
    
    const { id, token } = req.params as {
        id: string;
        token: string;
    }
    try{
    const user = await User.findById(id);
  
    if (!user) {
        res.status(400).json({ message: "No user found with this ID" });
        return;
    }
  
    const userToken = await Token.findOne({
        userId: user._id,
        token: token,
        type: 'passwordReset',
    });
  
    if (!userToken) {
        res.status(400).json({ message: "Invalid or expired token" });
        return;
    }

    // The TTL index will automatically remove expired tokens, but you can manually remove it after use
    await userToken.deleteOne();

    // Redirect to the password update page
    res.status(200).json({ message: "Token verified. You can now reset your password." });
    return;
}catch(error: any){
    console.error(error);
    res.status(500).json({ message: error.message });
    return;
}

};


// Update user's password
const updatePassword = async (req: Request, res: Response): Promise<void>  => {
    
    const { password, confirmPassword } = req.body as {
        password: string;
        confirmPassword: string;
    }
    const { id } = req.params as {
        id: string;
    };
    
try{
    // Check if the user exists
    const user = await User.findById(id);
    if (!user) {
        res.status(400).json({ message: "No user found with this ID" });
        return;
    }

    // Validate and compare passwords
    if (password !== confirmPassword) {
        res.status(400).json({ message: "Passwords do not match" });
        return;
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashPw = await bcrypt.hash(password, salt);

    // Update the user's password
    await User.findByIdAndUpdate(
        id,
        { password: hashPw },
        { new: true }
    );

    // Return success response
    res.status(200).json({
        message: "Password reset successful",
    });
    return;

}catch(error){
    console.log(error.message);
    res.status(500).json({ message: error.message || "Internal server error" });
}
    
};

// Logout user
const logOut = async (req: Request, res: Response): Promise<void>  => {
    const token = req.cookies.jwtGadgetToken || "";
    try{
    if (!token) {
        res.status(400).json({ message: "User not logged in" });
        return;
    }
        // Clear the JWT token
        res.cookie('jwtGadgetToken', '', {
            httpOnly: true,
            expires: new Date(0), // Expire the token immediately
            secure: process.env.NODE_ENV === 'production', // Only set secure flag in production
            sameSite: 'strict' // Helps mitigate CSRF attacks
        });
        console.log('JWT token cleared');
        res.status(200).json({ message: "Logged out successfully" });
        return;
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || "Internal server error" });
    }
};




export { registerUser, verifyToken, loginUser, forgotPassword, resetPassword, updatePassword, logOut };
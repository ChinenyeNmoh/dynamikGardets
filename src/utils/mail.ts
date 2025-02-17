import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";
import {User} from  '../type/userTypes'


// Email Rate Limiter (Prevents spam by limiting requests)
export const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit each IP to 5 email requests per `windowMs`
  message: "Too many email requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Email Sending Function
const sendEmail = async (email: string, subject: string, html: string): Promise<void> => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.HOST as string,
      service: process.env.SERVICE as string,
      port: Number(process.env.EMAIL_PORT),
      auth: {
        user: process.env.USER as string,
        pass: process.env.PASS as string,
      },
    });

    await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Email not sent!", (error as Error).message);
    throw error;
  }
};


const emailVerificationTemplate = (link:string, user:User ) => {
	return `
	  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; color: #333;">
		<div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
		  <h2 style="text-align: center; color: #28a745;">Verify Your Email</h2>
		  <p>Hi <strong style="color: #333;">${user.name}</strong>,</p>
		  <p style="font-size: 16px; color: #555;">
			Thank you for creating an account with DynamikGadgets. To complete your registration, please verify your email address by clicking the button below within the next 24 hours:
		  </p>
		  <div style="text-align: center; margin: 20px 0;">
			<a href="${link}" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
			  Verify Your Account
			</a>
		  </div>
		  <p style="font-size: 16px; color: #555;">
			If the button above isn’t working, paste the following link into your browser:
		  </p>
		  <p style="word-break: break-all; font-size: 16px; color: #28a745; text-align: center;">
			<a href="${link}" style="color: #28a745;">${link}</a>
		  </p>
		  <p style="font-size: 16px; color: #555;">
			If you did not create an account with DynamikGadgets, you can safely ignore this email.
		  </p>
		  <p style="font-size: 16px; color: #555;">Thank you for choosing DynamikGadgets.</p>
		</div>
		<div style="text-align: center; margin-top: 30px; font-size: 12px; color: #aaa;">
		  <p>If you have any questions, feel free to <a href="mailto:support@dynamikgadgets.com" style="color: #28a745;">contact our support team</a>.</p>
		  <p>© DynamikGadgets | All rights reserved.</p>
		</div>
	  </div>
	`;
  };
  

const passwordResetTemplate = (link:string, user:User) => {
	return `
	  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; color: #333;">
		<div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
		  <h2 style="text-align: center; color: #007BFF;">Password Reset Request</h2>
		  <p>Hi <strong style="color: #333;">${user.name}</strong>,</p>
		  <p style="font-size: 16px; color: #555;">
			There was recently a request to change the password on your account. 
			If you requested this password change, please click the button below to set a new password within 24 hours:
		  </p>
		  <div style="text-align: center; margin: 20px 0;">
			<a href="${link}" style="display: inline-block; background-color: #007BFF; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
			  Reset Your Password
			</a>
		  </div>
		  <p style="font-size: 16px; color: #555;">
			If the button above isn’t working, paste the following link into your browser:
		  </p>
		  <p style="word-break: break-all; font-size: 16px; color: #007BFF; text-align: center;">
			<a href="${link}" style="color: #007BFF;">${link}</a>
		  </p>
		  <p style="font-size: 16px; color: #555;">
			If you don't want to change your password, just ignore this message.
		  </p>
		  <p style="font-size: 16px; color: #555;">Thank you for choosing DynamikGadgets.</p>
		</div>
		<div style="text-align: center; margin-top: 30px; font-size: 12px; color: #aaa;">
		  <p>If you have any questions, feel free to <a href="mailto:support@zestfulblends.com" style="color: #007BFF;">contact our support team</a>.</p>
		  <p>© DynamikGadgets | All rights reserved.</p>
		</div>
	  </div>
	`;
  };

export { sendEmail, emailVerificationTemplate, passwordResetTemplate };

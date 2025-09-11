import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { db } from "../db";
import { users, magicLinks } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret";
const MAGIC_LINK_SECRET = process.env.MAGIC_LINK_SECRET || "your-magic-link-secret";

// Configure SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export class AuthService {
  async generateMagicLink(email: string): Promise<string> {
    // Check if user exists
    let [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // If user doesn't exist, create them
    if (!existingUser) {
      // Extract name from email (part before @)
      const name = email.split('@')[0].replace(/[._-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const [newUser] = await db.insert(users).values({
        email,
        name,
        role: "USER",
        isActive: true,
      }).returning();

      existingUser = newUser;
    } else if (!existingUser.isActive) {
      // Reactivate inactive user
      const [reactivatedUser] = await db
        .update(users)
        .set({ isActive: true })
        .where(eq(users.id, existingUser.id))
        .returning();
      
      existingUser = reactivatedUser;
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store magic link
    await db.insert(magicLinks).values({
      email,
      token,
      expiresAt,
    });

    // Create the magic link URL
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    return `${baseUrl}/auth/verify?token=${token}`;
  }

  async sendMagicLink(email: string): Promise<void> {
    const magicLinkUrl = await this.generateMagicLink(email);

    // In development, just log the magic link instead of sending email
    if (process.env.NODE_ENV === "development") {
      console.log(`🔗 Magic link for ${email}: ${magicLinkUrl}`);
      return;
    }

    // Try to send email, but don't fail if SMTP is not configured
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || "noreply@coursesentinel.com",
        to: email,
        subject: "Course Update Sentinel - Magic Link Login",
        html: `
          <!DOCTYPE html>
          <html dir="ltr">
          <head>
            <meta charset="UTF-8">
            <title>Login to Course Update Sentinel</title>
            <style>
              body { font-family: 'Roboto', sans-serif; background: #000; color: #fff; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .logo { color: #ff6600; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
              .content { background: #0a0a0a; padding: 30px; border-radius: 8px; border-top: 3px solid #ff6600; }
              .button { display: inline-block; background: #ff6600; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
              .footer { margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">Course Update Sentinel - الذكاء للأعمال</div>
              <div class="content">
                <h2>Welcome back!</h2>
                <p>Click the button below to securely sign in to your Course Update Sentinel dashboard:</p>
                <a href="${magicLinkUrl}" class="button">Sign In to Dashboard</a>
                <p>This link will expire in 15 minutes for your security.</p>
                <p>If you didn't request this login, please ignore this email.</p>
              </div>
              <div class="footer">
                <p>Course Update Sentinel - AI-powered course maintenance system</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      // Log the error but don't fail the request
      console.warn(`Failed to send email to ${email}:`, error.message);
      
      // Only log magic link in development for security
      if (process.env.NODE_ENV === "development") {
        console.log(`🔗 Magic link for ${email}: ${magicLinkUrl}`);
      }
      
      // In production, you might want to throw the error
      // throw new Error("Failed to send magic link email");
    }
  }

  async verifyMagicLink(token: string): Promise<AuthUser> {
    // Find the magic link
    const [magicLink] = await db
      .select()
      .from(magicLinks)
      .where(and(eq(magicLinks.token, token), eq(magicLinks.used, false)))
      .limit(1);

    if (!magicLink) {
      throw new Error("Invalid or expired magic link");
    }

    if (magicLink.expiresAt < new Date()) {
      throw new Error("Magic link has expired");
    }

    // Mark magic link as used
    await db
      .update(magicLinks)
      .set({ used: true })
      .where(eq(magicLinks.id, magicLink.id));

    // Get user details
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, magicLink.email))
      .limit(1);

    if (!user || !user.isActive) {
      throw new Error("User not found or inactive");
    }

    // Update last login
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  generateJWT(user: AuthUser): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
  }

  verifyJWT(token: string): AuthUser {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      };
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  async getCurrentUser(authHeader?: string): Promise<AuthUser | null> {
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    try {
      return this.verifyJWT(token);
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../utils/prisma');
const { generateToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');
const { isAllowedDomain } = require('../utils/allowedDomains');
const { sendOtpEmail } = require('../utils/email');

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Generate a cryptographically secure 6-digit OTP
 */
function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * POST /api/auth/register
 * Step 1: Validate input, check email domain, send OTP
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return error(res, 'Name, email and password are required', 400);
    }

    if (password.length < 6) {
      return error(res, 'Password must be at least 6 characters', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return error(res, 'Invalid email address', 400);
    }

    // Domain whitelist check
    if (!isAllowedDomain(email)) {
      return error(res, 'Please use an authenticated mail provider (Gmail, Outlook, Yahoo, etc.)', 400);
    }

    // Check if email is already registered as a verified user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return error(res, 'Email already registered', 409);
    }

    // Check resend cooldown — if a pending OTP exists and was created < 60s ago
    const existingOtp = await prisma.otpVerification.findUnique({ where: { email } });
    if (existingOtp) {
      const elapsed = (Date.now() - existingOtp.createdAt.getTime()) / 1000;
      if (elapsed < RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed);
        return error(res, `Please wait ${wait} seconds before requesting another OTP`, 429);
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate & hash OTP
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Upsert pending verification (replaces any previous OTP for this email)
    await prisma.otpVerification.upsert({
      where: { email },
      create: { name, email, passwordHash, otpHash, expiresAt, attempts: 0 },
      update: { name, passwordHash, otpHash, expiresAt, attempts: 0, createdAt: new Date() },
    });

    // Send OTP email
    await sendOtpEmail(email, otp, name);

    return success(res, { email }, 'Verification code sent to your email', 200);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/verify-otp
 * Step 2: Verify OTP, create account, return JWT
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return error(res, 'Email and OTP are required', 400);
    }

    const pending = await prisma.otpVerification.findUnique({ where: { email } });
    if (!pending) {
      return error(res, 'No pending verification found. Please register again.', 404);
    }

    // Check expiry
    if (new Date() > pending.expiresAt) {
      await prisma.otpVerification.delete({ where: { email } });
      return error(res, 'Verification code has expired. Please register again.', 410);
    }

    // Check attempt limit
    if (pending.attempts >= MAX_OTP_ATTEMPTS) {
      await prisma.otpVerification.delete({ where: { email } });
      return error(res, 'Too many incorrect attempts. Please register again.', 429);
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, pending.otpHash);
    if (!isValid) {
      await prisma.otpVerification.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });
      const remaining = MAX_OTP_ATTEMPTS - pending.attempts - 1;
      return error(res, `Invalid verification code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`, 401);
    }

    // OTP valid — create the user
    const user = await prisma.user.create({
      data: {
        name: pending.name,
        email: pending.email,
        passwordHash: pending.passwordHash,
      },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    // Clean up OTP record
    await prisma.otpVerification.delete({ where: { email } });

    const token = generateToken(user.id);

    return success(res, { user, token }, 'Account verified and created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/resend-otp
 * Resend a new OTP (rate-limited to 1 per 60 seconds)
 */
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return error(res, 'Email is required', 400);
    }

    const pending = await prisma.otpVerification.findUnique({ where: { email } });
    if (!pending) {
      return error(res, 'No pending verification found. Please register again.', 404);
    }

    // Cooldown check
    const elapsed = (Date.now() - pending.createdAt.getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed);
      return error(res, `Please wait ${wait} seconds before requesting another OTP`, 429);
    }

    // Generate new OTP
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otpVerification.update({
      where: { email },
      data: { otpHash, expiresAt, attempts: 0, createdAt: new Date() },
    });

    await sendOtpEmail(email, otp, pending.name);

    return success(res, { email }, 'New verification code sent', 200);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'Email and password are required', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return error(res, 'Invalid email or password', 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return error(res, 'Invalid email or password', 401);
    }

    const token = generateToken(user.id);

    return success(res, {
      user: { id: user.id, name: user.name, email: user.email },
      token,
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    return success(res, { user: req.user }, 'User fetched');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, verifyOtp, resendOtp, login, getMe };

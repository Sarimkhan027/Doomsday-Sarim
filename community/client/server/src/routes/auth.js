import {
  Router
} from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import {
  requireAuth
} from '../middleware/requireAuth.js';

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(user) {
  return jwt.sign({
    sub: user.id,
    username: user.username,
    role: user.role
  }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
}

router.post('/register', async (request, response, next) => {
  try {
    const username = String(request.body.username || '').trim();
    const email = String(request.body.email || '').trim().toLowerCase();
    const password = String(request.body.password || '');

    if (username.length < 2 || username.length > 18) {
      return response.status(400).json({
        error: 'Username must be 2–18 characters.'
      });
    }

    if (!emailPattern.test(email) || email.length > 254) {
      return response.status(400).json({
        error: 'Enter a valid email address.'
      });
    }

    if (password.length < 10 || password.length > 128) {
      return response.status(400).json({
        error: 'Password must be 10–128 characters.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      username,
      email,
      passwordHash
    });

    return response.status(201).json({
      token: createToken(user),
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({
        error: 'That username or email is already registered.'
      });
    }
    return next(error);
  }
});

router.post('/login', async (request, response, next) => {
  try {
    const email = String(request.body.email || '').trim().toLowerCase();
    const password = String(request.body.password || '');
    const user = await User.findOne({
      email
    }).select('+passwordHash');

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return response.status(401).json({
        error: 'Email or password is incorrect.'
      });
    }

    return response.json({
      token: createToken(user),
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireAuth, async (request, response, next) => {
  try {
    const user = await User.findById(request.user.sub).select('username email role createdAt');
    if (!user) return response.status(404).json({
      error: 'Player account not found.'
    });
    return response.json({
      user
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
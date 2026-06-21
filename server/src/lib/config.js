import 'dotenv/config';

function required(name, fallback) {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    // Defer hard failure to runtime so `npm install` etc. still work,
    // but make misconfiguration loud at boot.
    console.warn(`[config] Missing environment variable: ${name}`);
  }
  return v;
}

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: required('JWT_SECRET', process.env.NODE_ENV === 'production' ? undefined : 'dev-only-insecure-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  admin: {
    email: process.env.ADMIN_EMAIL || '',
    password: process.env.ADMIN_PASSWORD || '',
    name: process.env.ADMIN_NAME || 'Aviva Admin',
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
};

export function assertProductionConfig() {
  if (config.nodeEnv === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 24) {
      throw new Error('JWT_SECRET must be set to a strong value (>=24 chars) in production.');
    }
  }
}

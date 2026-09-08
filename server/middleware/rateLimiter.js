const rateLimit = require('express-rate-limit');

// Authentication Limiter (50-100 per 15 mins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '100', 10),
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Answer Saving Limiter (High throughput: 1,200/min per IP to support 2,000 students)
const answerLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_ANSWER_MAX || '1200', 10),
  message: {
    success: false,
    message: 'Answer submission rate limit exceeded. Please wait a moment.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Heartbeat Limiter (600/min per IP)
const heartbeatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_HEARTBEAT_MAX || '600', 10),
  standardHeaders: true,
  legacyHeaders: false,
});

// Integrity Events Limiter (300/min per IP)
const integrityLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_INTEGRITY_MAX || '300', 10),
  message: {
    success: false,
    message: 'Integrity event telemetry threshold reached.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// GraphQL Limiter (600/min per IP)
const graphqlLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_GRAPHQL_MAX || '600', 10),
  message: {
    success: false,
    message: 'GraphQL query rate limit exceeded.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API Limiter (2,000/min per IP)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_API_MAX || '2000', 10),
  message: {
    success: false,
    message: 'Too many requests from this IP, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  answerLimiter,
  heartbeatLimiter,
  integrityLimiter,
  graphqlLimiter,
  apiLimiter,
};

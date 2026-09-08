const express = require('express');
const { graphql } = require('graphql');
const jwt = require('jsonwebtoken');
const schema = require('./schema');
const rootResolver = require('./resolvers');
const User = require('../models/User');
const { graphqlLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply GraphQL Rate Limiter
router.use(graphqlLimiter);

router.post('/', async (req, res) => {
  const { query, variables } = req.body;

  if (!query) {
    return res.status(400).json({ errors: [{ message: 'GraphQL query is required in request body.' }] });
  }

  // Resolve user authentication context
  let user = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'examsphere_enterprise_super_secret_jwt_key_2026');
      user = await User.findById(decoded.id).select('-passwordHash');
    } catch (err) {
      // Invalid/expired token: user stays null, resolvers enforce auth check
    }
  }

  const context = {
    user,
    ip: req.ip,
  };

  try {
    const result = await graphql({
      schema,
      source: query,
      rootValue: rootResolver,
      contextValue: context,
      variableValues: variables,
    });

    if (result.errors && result.errors.length > 0) {
      return res.status(200).json({
        data: result.data || null,
        errors: result.errors.map((e) => ({ message: e.message })),
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      errors: [{ message: error.message || 'Internal GraphQL execution error' }],
    });
  }
});

// Support GET for GraphQL Playground / inspection
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ACTIVE',
    service: 'ExamSphere GraphQL API',
    usage: 'POST queries and mutations to this endpoint with JSON body { query, variables }',
  });
});

module.exports = router;

const Joi = require('joi');

/**
 * Validation Schemas using Joi
 * Provides robust input validation for all API endpoints
 */

// User registration validation
const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(20)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only letters and numbers',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 20 characters',
      'any.required': 'Username is required'
    }),
  password: Joi.string()
    .min(6)
    .max(50)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 50 characters',
      'any.required': 'Password is required'
    }),
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address'
    })
});

// User login validation
const loginSchema = Joi.object({
  username: Joi.string()
    .required()
    .messages({
      'any.required': 'Username is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Team creation validation
const createTeamSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.min': 'Team name must be at least 3 characters long',
      'string.max': 'Team name cannot exceed 30 characters',
      'any.required': 'Team name is required'
    }),
  starters: Joi.array()
    .items(Joi.string().hex().length(24))
    .length(5)
    .required()
    .messages({
      'array.length': 'Must select exactly 5 starters',
      'any.required': 'Starters are required'
    }),
  subs: Joi.array()
    .items(Joi.string().hex().length(24))
    .length(2)
    .required()
    .messages({
      'array.length': 'Must select exactly 2 substitutes',
      'any.required': 'Substitutes are required'
    }),
  captain: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'any.required': 'Captain is required'
    }),
  viceCaptain: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'any.required': 'Vice-captain is required'
    })
});

// Player transfer validation
const transferPlayerSchema = Joi.object({
  playerId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'any.required': 'Player ID is required'
    }),
  replacementId: Joi.string()
    .hex()
    .length(24)
    .optional()
    .messages({
      'string.hex': 'Invalid replacement player ID'
    })
});

// Chip usage validation
const useChipSchema = Joi.object({
  chipType: Joi.string()
    .valid('wildcard', 'tripleCaptain', 'benchBoost', 'freeHit')
    .required()
    .messages({
      'any.only': 'Invalid chip type',
      'any.required': 'Chip type is required'
    })
});

// Ticket creation validation
const createTicketSchema = Joi.object({
  subject: Joi.string()
    .min(5)
    .max(100)
    .required()
    .messages({
      'string.min': 'Subject must be at least 5 characters long',
      'string.max': 'Subject cannot exceed 100 characters',
      'any.required': 'Subject is required'
    }),
  description: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description cannot exceed 1000 characters',
      'any.required': 'Description is required'
    }),
  category: Joi.string()
    .valid('technical', 'billing', 'robux', 'gameplay', 'account', 'other')
    .required()
    .messages({
      'any.only': 'Invalid category',
      'any.required': 'Category is required'
    }),
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .default('medium')
});

// Player market filter validation
const playerFilterSchema = Joi.object({
  position: Joi.string()
    .valid('GK', 'CDM', 'LW', 'RW')
    .optional(),
  region: Joi.string()
    .optional(),
  minPrice: Joi.number()
    .min(0)
    .optional(),
  maxPrice: Joi.number()
    .min(0)
    .optional(),
  available: Joi.boolean()
    .optional(),
  sortBy: Joi.string()
    .valid('price', 'overall', 'name', 'position')
    .default('overall'),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc'),
  page: Joi.number()
    .min(1)
    .default(1),
  limit: Joi.number()
    .min(1)
    .max(100)
    .default(20)
});

/**
 * Validation Middleware Factory
 * Creates middleware that validates request body against provided schema
 */
const validateRequest = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    // Replace request property with validated and sanitized value
    req[property] = value;
    next();
  };
};

/**
 * MongoDB ObjectId validation
 */
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: `Invalid ${paramName}. Must be a valid MongoDB ObjectId.`
      });
    }
    
    next();
  };
};

module.exports = {
  // Schemas
  registerSchema,
  loginSchema,
  createTeamSchema,
  transferPlayerSchema,
  useChipSchema,
  createTicketSchema,
  playerFilterSchema,
  
  // Middleware
  validateRequest,
  validateObjectId
};

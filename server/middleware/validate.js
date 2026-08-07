const { validationResult } = require('express-validator');

/**
 * Middleware to check express-validator results.
 * If there are validation errors, respond 422 with the first error message.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(422).json({
      success: false,
      message: firstError.msg,
      field: firstError.path,
      errors: errors.array(),
    });
  }
  next();
};

module.exports = validate;

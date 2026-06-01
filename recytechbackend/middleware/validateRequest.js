const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        console.error("Validation Error:", firstError);
        return res.status(400).json({ 
            message: `Validation failed: ${firstError.msg} (${firstError.path || firstError.param})`,
            errors: errors.array() 
        });
    }
    next();
};

module.exports = { validateRequest };
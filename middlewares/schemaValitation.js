//validate request schema

const { validationError } = require("../utils/responseHandler");

module.exports = (schema) => (req, resp, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const messages = error.details.map((d) => d.message);
    return validationError(resp, messages);
  }

  next(); // validation passed
};

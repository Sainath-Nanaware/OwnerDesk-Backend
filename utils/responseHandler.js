exports.successResponse = (
  res,
  data = {},
  message = "Success",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

exports.errorResponse = (
  res,
  message = "Something went wrong",
  statusCode = 500,
  errors = {}
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

exports.validationError = (res, errors) =>
  res
    .status(400)
    .json({ success: false, message: "Validation failed", errors });

exports.unauthorized = (res) =>
  res.status(401).json({ success: false, message: "Unauthorized" });

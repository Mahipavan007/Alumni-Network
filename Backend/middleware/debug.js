const debugMiddleware = (req, res, next) => {
  console.log('Request:', {
    method: req.method,
    path: req.path,
    body: req.body,
    headers: req.headers
  });
  next();
};

module.exports = debugMiddleware;

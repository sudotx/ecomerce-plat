/**
 * 404 handler — any request that did not match a route.
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Central error handler — the last middleware in the chain.
 * Any error passed to next(err) ends up here.
 */
export function errorHandler(err, req, res, next) {
  console.error(err);

  const status = err.status || err.statusCode || 500;
  const message =
    status >= 500 ? "Internal server error" : err.message;

  res.status(status).json({ message });
}
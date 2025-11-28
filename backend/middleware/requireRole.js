export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized (no user)" });
    }

    if (!req.user.role) {
      return res.status(403).json({ error: "No role found for this user" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied. Insufficient permissions.",
        required: allowedRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

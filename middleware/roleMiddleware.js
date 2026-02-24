// Restrict access based on user roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to perform this action' 
      });
    }

    next();
  };
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
  next();
};

// Check if user is IT Staff
exports.isITStaff = (req, res, next) => {
  if (!req.user || req.user.role !== 'it_staff') {
    return res.status(403).json({ 
      success: false, 
      message: 'IT Staff access required' 
    });
  }
  next();
};

// Check if user is admin or IT staff
exports.isAdminOrIT = (req, res, next) => {
  if (!req.user || !['admin', 'it_staff'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin or IT Staff access required' 
    });
  }
  next();
};

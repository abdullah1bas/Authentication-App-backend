const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const verifyJWT = require("../middleware/verifyJWT");

// Middleware للتحقق من صلاحيات "admin"
const verifyAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Admins only' });
  }
  next();
};

// استخدام verifyJWT للتحقق من التوكن
router.use(verifyJWT);

// فقط المستخدمين بـ role "admin" يمكنهم الوصول لهذه المسارات
router.route("/").get(verifyAdmin, usersController.getAllUsers);

module.exports = router;







// const express = require("express");
// const router = express.Router();
// const usersController = require("../controllers/usersController");
// const verifyJWT = require("../middleware/verifyJWT");

// router.use(verifyJWT);
// router.route("/").get(usersController.getAllUsers);

// module.exports = router;





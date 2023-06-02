const express = require('express');
//validation
const { check, body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');
const router = express.Router();
const isAuth = require('../middleware/isauth');

router.put(
  '/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .custom(async (value, { req }) => {
        const user = await User.findOne({ email: value });
        if (user) {
          return Promise.reject('E-mail address already exists!');
        }
      })
      .normalizeEmail(),

    body('password').trim().isLength({ min: 5 }),
    body('name').trim().not().isEmpty(),
  ],
  authController.signUp,
);

router.post('/login', authController.login);

router.get('/status', isAuth, authController.getUserStatus);
router.patch(
  '/status',
  isAuth,
  [body('status').trim().not().isEmpty()],
  authController.updateUserStatus,
);

module.exports = router;

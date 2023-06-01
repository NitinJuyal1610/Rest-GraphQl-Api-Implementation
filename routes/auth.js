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
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject('E-mail address already exists!');
          }
        });
      })
      .normalizeEmail(),

    body('password').trim().isLength({ min: 5 }),
    body('name').trim().not().isEmpty(),
  ],
  authController.signUp,
);

router.post('/login', authController.login);

module.exports = router;

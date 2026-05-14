const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

router.post('/register',        authController.register);
router.post('/login',           authController.login);
router.patch('/password',       authMiddleware, authController.changePassword);
router.patch('/currency',       authMiddleware, authController.updateCurrency);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password',  authController.resetPassword);

module.exports = router;

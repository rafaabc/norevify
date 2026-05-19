const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const remindersController = require('../controllers/reminders.controller');

const router = Router();
router.use(authMiddleware);

router.get('/badge-count',     remindersController.badgeCount);
router.get('/',                remindersController.list);
router.get('/:id',             remindersController.getOne);
router.post('/',               remindersController.create);
router.put('/:id',             remindersController.update);
router.post('/:id/complete',   remindersController.complete);
router.delete('/:id',          remindersController.remove);

module.exports = router;

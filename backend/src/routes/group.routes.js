import express from 'express';
import { createGroup, joinGroup, getMyGroups } from '../controllers/group.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All group routes require authentication
router.use(authenticate);

router.post('/create', createGroup);
router.post('/join', joinGroup);
router.get('/my-groups', getMyGroups);

export default router;
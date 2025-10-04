import { Router } from 'express';
import { initHandler } from '../controllers/initHandler';
import { getCommentsHandler } from '../controllers/getCommentsHandler';
import { debugRedisHandler } from '../controllers/debugRedisHandler';

const router = Router();

router.get('/api/init', initHandler);
router.get('/api/comments', getCommentsHandler);
router.get('/api/debug/redis', debugRedisHandler);

export default router;

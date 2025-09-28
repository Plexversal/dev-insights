import { Router } from 'express';
import { initHandler } from '../controllers/initHandler';
import { incrementHandler } from '../controllers/incrementHandler';
import { decrementHandler } from '../controllers/decrementHandler';
import { getCommentsHandler } from '../controllers/getCommentsHandler';
import { debugRedisHandler } from '../controllers/debugRedisHandler';

const router = Router();

router.get('/api/init', initHandler);
router.post('/api/increment', incrementHandler);
router.post('/api/decrement', decrementHandler);
router.get('/api/comments', getCommentsHandler);
router.get('/api/debug/redis', debugRedisHandler);

export default router;
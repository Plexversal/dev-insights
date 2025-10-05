import { Router } from 'express';
import { initHandler } from '../controllers/initHandler';
import { getCommentsHandler } from '../controllers/getCommentsHandler';
import { debugRedisHandler } from '../controllers/debugRedisHandler';
import { getPostsHandler } from '../controllers/getPostsHandler';

const router = Router();

router.get('/api/init', initHandler);
router.get('/api/comments', getCommentsHandler);
router.get('/api/posts', getPostsHandler)
router.get('/api/debug/redis', debugRedisHandler);

export default router;

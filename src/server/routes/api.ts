import { Router } from 'express';
import { initHandler } from '../controllers/initHandler';
import { getCommentsHandler } from '../controllers/getCommentsHandler';
import { debugRedisHandler } from '../controllers/debugRedisHandler';
import { getPostsHandler } from '../controllers/getPostsHandler';
import { deletePostHandler } from '../controllers/deletePostHandler';
import { deleteCommentHandler } from '../controllers/deleteCommentHandler';
import { checkModHandler } from '../controllers/checkModHandler';

const router = Router();

router.get('/api/init', initHandler);
router.get('/api/comments', getCommentsHandler);
router.get('/api/posts', getPostsHandler);
router.get('/api/check-mod', checkModHandler);
router.delete('/api/posts/:postId', deletePostHandler);
router.delete('/api/comments/:commentId', deleteCommentHandler);
router.get('/api/debug/redis', debugRedisHandler);

export default router;

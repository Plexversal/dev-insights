import { Router } from 'express';
import { initHandler } from '../controllers/initHandler';
import { getCommentsHandler } from '../controllers/getCommentsHandler';
import { debugRedisHandler } from '../controllers/debugRedisHandler';
import { getPostsHandler } from '../controllers/getPostsHandler';
import { deletePostHandler } from '../controllers/deletePostHandler';
import { deleteCommentHandler } from '../controllers/deleteCommentHandler';
import { checkModHandler } from '../controllers/checkModHandler';
import { postUserAnalytics } from '../controllers/postUserAnalytics';
import { getAnalyticsHandler } from '../controllers/getAnalyticsHandler';
import { getCustomLabels } from '../controllers/getCustomLabels';
import { toggleNotificationsHandler, getNotificationStatusHandler } from '../controllers/toggleNotificationsHandler';
import { getCriticalLogsHandler } from '../controllers/getCriticalLogsHandler';

const router = Router();

router.get('/api/init', initHandler);
router.get('/api/comments', getCommentsHandler);
router.get('/api/posts', getPostsHandler);
router.get('/api/check-mod', checkModHandler);
router.delete('/api/posts/:postId', deletePostHandler);
router.delete('/api/comments/:commentId', deleteCommentHandler);
router.get('/api/debug/redis', debugRedisHandler);
router.get('/api/analytics', getAnalyticsHandler);
router.post('/api/analytics', postUserAnalytics);
router.get('/api/custom-labels', getCustomLabels);
router.post('/api/notifications/toggle', toggleNotificationsHandler);
router.get('/api/notifications/status', getNotificationStatusHandler);
router.get('/api/debug/critical-logs', getCriticalLogsHandler);

export default router;

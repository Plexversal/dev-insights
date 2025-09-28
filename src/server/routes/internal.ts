import { Router } from 'express';
import { appInstallHandler } from '../controllers/appInstallHandler';
import { postCreateHandler } from '../controllers/postCreateHandler';
import { postCommentCreate } from '../controllers/postCommentCreate';

const router = Router();

router.post('/internal/on-app-install', appInstallHandler);
router.post('/internal/menu/post-create', postCreateHandler);
router.post('/internal/on-comment-create', postCommentCreate)

export default router;

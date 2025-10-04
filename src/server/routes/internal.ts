import { Router } from 'express';
import { appInstallHandler } from '../controllers/appInstallHandler';
import { postCreateHandler } from '../controllers/postCreateHandler';
import { postCommentCreate } from '../controllers/postCommentCreate';
import { validateUsers } from '../controllers/validateUsers';
import { validateCssClass } from '../controllers/validateCssClass';
import { validateFlairText } from '../controllers/validateFlairText';

const router = Router();

router.post('/internal/on-app-install', appInstallHandler);
router.post('/internal/menu/post-create', postCreateHandler);
router.post('/internal/on-comment-create', postCommentCreate);
router.post('/internal/settings/validate-users', validateUsers);
router.post('/internal/settings/validate-cssclass', validateCssClass);
router.post('/internal/settings/validate-flairtext', validateFlairText);

export default router;

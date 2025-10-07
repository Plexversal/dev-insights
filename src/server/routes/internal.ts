import { Router } from 'express';
import { postCreateHandler } from '../controllers/postCreateHandler';
import { postCommentCreate } from '../controllers/postCommentCreate';
import { validateUsers } from '../controllers/validateUsers';
import { validateCssClass } from '../controllers/validateCssClass';
import { validateFlairText } from '../controllers/validateFlairText';
import { postPostCreate } from '../controllers/postPostCreate';
import { postOnCommentDelete } from '../controllers/triggers/postOnCommentDelete';
import { postOnPostDelete } from '../controllers/triggers/postOnPostDelete';
import { postOnCommentUpdate } from '../controllers/triggers/postOnCommentUpdate';
import { postOnPostUpdate } from '../controllers/triggers/postOnPostUpdate';
import { postOnAppInstall } from '../controllers/triggers/postOnAppInstall';
import { postFetchUserContent } from '../controllers/menu/postFetchUserContent';
import { postAddManualComment } from '../controllers/menu/postAddManualComment';
import { postAddManualPost } from '../controllers/menu/postAddManualPost';


const router = Router();

// menu items
router.post('/internal/menu/post-create', postCreateHandler);
router.post('/internal/menu/fetch-user-content', postFetchUserContent);
router.post('/internal/menu/add-manual-comment', postAddManualComment);
router.post('/internal/menu/add-manual-post', postAddManualPost);


// triggers
router.post('/internal/on-app-install', postOnAppInstall);
router.post('/internal/on-post-create', postPostCreate);
router.post('/internal/on-post-delete', postOnPostDelete);
router.post('/internal/on-post-update', postOnPostUpdate);
router.post('/internal/on-comment-create', postCommentCreate);
router.post('/internal/on-comment-update', postOnCommentUpdate);
router.post('/internal/on-comment-delete', postOnCommentDelete);

// form validation routes
router.post('/internal/settings/validate-users', validateUsers);
router.post('/internal/settings/validate-cssclass', validateCssClass);
router.post('/internal/settings/validate-flairtext', validateFlairText);


export default router;

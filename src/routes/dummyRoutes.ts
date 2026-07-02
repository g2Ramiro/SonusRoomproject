import { Router } from 'express';
import * as dummyController from '../controllers/dummyController';

const router = Router();

router.get('/health', dummyController.health);
router.get('/dummy', dummyController.dummy);

export default router;

import { Router } from 'express';
import * as trackController from '../controllers/trackController';
import { isAuthorized } from '../middlewares/authMiddleware';
import uploadCloud from '../config/cloudinary';

const router = Router();

router.get('/', trackController.getAllTracks);
router.get('/:id', trackController.getTrackById);
router.post('/', isAuthorized, uploadCloud.single('file'), trackController.createTrack);
router.post('/:id/lyrics', isAuthorized, trackController.fetchTrackLyrics);
router.put('/:id', isAuthorized, trackController.updateTrack);
router.delete('/:id', isAuthorized, trackController.deleteTrack);

export default router;

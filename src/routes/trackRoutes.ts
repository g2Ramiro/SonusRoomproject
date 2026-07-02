import { Router } from 'express';
import * as trackController from '../controllers/trackController';
import uploadCloud from '../config/cloudinary';

const router = Router();

router.post('/', uploadCloud.single('file'), trackController.createTrack);
router.get('/', trackController.getAllTracks);
router.get('/:id', trackController.getTrackById);
router.put('/:id', trackController.updateTrack);
router.delete('/:id', trackController.deleteTrack);

export default router;
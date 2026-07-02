import { Router } from 'express';
import * as roomController from '../controllers/roomsController';
import { isAuthorized } from '../middlewares/authMiddleware';
import uploadCloud from '../config/cloudinary'; 

const router = Router();

router.get('/', roomController.getAllRooms);
router.post('/', isAuthorized, roomController.createRoom);
router.put('/:codigo', roomController.updateRoomState);
router.delete('/:codigo', roomController.deleteRoom);
router.post('/:codigo/upload', isAuthorized, uploadCloud.single('audio'), roomController.addQueue);

export default router;
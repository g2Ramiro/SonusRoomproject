import { Router } from 'express';
import * as roomController from '../controllers/roomsController';

const router = Router();

router.post('/', roomController.createRoom);
router.get('/', roomController.getAllRooms);
router.put('/:codigo', roomController.updateRoomState);
router.delete('/:codigo', roomController.deleteRoom);

export default router;
import express from 'express';
import {
  // public
  searchAgent,
  createInbox,
  getPresence,
  // admin
  setPresence,
  listRooms,
  getRoomMessages,
  forwardTranscript,
  deleteRoom,
  listInbox,
  updateInboxStatus,
} from '../controllers/agentController.js';

import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

/* ---------------- Public endpoints ---------------- */

// Read presence (user widget uses this)
router.get('/status', getPresence);

// Smart Q&A (quick/wiki/site)
router.get('/search', searchAgent);

// Capture inbox when admin offline
router.post('/inbox', createInbox);

/* ---------------- Admin-protected endpoints ---------------- */
router.use(protect, admin);

// Set presence (Online/Offline)
router.put('/status', setPresence);

// Rooms
router.get('/rooms', listRooms);
router.get('/rooms/:roomId/messages', getRoomMessages);
router.post('/rooms/:roomId/forward', forwardTranscript);
router.delete('/rooms/:roomId', deleteRoom);

// Inbox management
router.get('/inbox', listInbox);
router.put('/inbox/:id', updateInboxStatus);

export default router;

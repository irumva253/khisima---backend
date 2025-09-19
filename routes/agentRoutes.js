// backend/routes/agentRoutes.js
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
router.route('/status')
  .get(getPresence)          // GET /api/agent/status
  .put(protect, admin, setPresence); // PUT /api/agent/status (admin only)

router.route('/search')
  .get(searchAgent);         // GET /api/agent/search?q=...

router.route('/inbox')
  .post(createInbox)         // POST /api/agent/inbox (user capture)
  .get(protect, admin, listInbox); // GET /api/agent/inbox (admin only)

router.route('/inbox/:id')
  .put(protect, admin, updateInboxStatus); // PUT /api/agent/inbox/:id

/* ---------------- Admin-protected: Rooms ---------------- */
router.route('/rooms')
  .get(protect, admin, listRooms); // GET /api/agent/rooms

router.route('/rooms/:roomId/messages')
  .get(protect, admin, getRoomMessages); // GET /api/agent/rooms/:roomId/messages

router.route('/rooms/:roomId/forward')
  .post(protect, admin, forwardTranscript); // POST /api/agent/rooms/:roomId/forward

router.route('/rooms/:roomId')
  .delete(protect, admin, deleteRoom); // DELETE /api/agent/rooms/:roomId

export default router;

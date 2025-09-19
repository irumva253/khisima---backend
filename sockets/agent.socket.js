// backend/sockets/agent.socket.js
import AdminPresence from '../models/AdminPresence.js';
import ChatRoom from '../models/ChatRoom.js';
import ChatMessage from '../models/ChatMessage.js';

let ioRef = null;

export async function initAdminPresence() {
  const doc = await AdminPresence.findOne({ key: 'global' });
  if (!doc) {
    await AdminPresence.create({ key: 'global', online: false });
  }
}


export async function broadcastPresence(online) {
  try {
    await AdminPresence.updateOne(
      { key: 'global' },
      { $set: { online, updatedAt: new Date() } },
      { upsert: true }
    );
    if (ioRef) {
      ioRef.emit('agent:admin_status', { online: !!online });
    }
  } catch (e) {
    console.error('broadcastPresence error', e?.message || e);
  }
}

export default function attachAgentSocket(io) {
  ioRef = io;

  io.on('connection', (socket) => {
    const role = String(socket.handshake.query?.role || '').toLowerCase();
    const room = String(socket.handshake.query?.room || '');

    if (role === 'user' && room) socket.join(room);
    if (role === 'admin') socket.join('admins');

    socket.on('agent:join_room', async ({ room: r }) => {
      if (role === 'user' && r) socket.join(r);
    });

    socket.on('agent:admin_status:get', async () => {
      const doc = await AdminPresence.findOne({ key: 'global' });
      socket.emit('agent:admin_status', { online: !!doc?.online });
    });

    // USER -> message
    socket.on('agent:user_message', async ({ room: r, text }) => {
      if (!r || !text?.trim()) return;
      await ChatRoom.updateOne(
        { roomId: r },
        { $set: { lastMsgAt: new Date() }, $inc: { unread: 1 } },
        { upsert: true }
      );
      await ChatMessage.create({ roomId: r, role: 'user', text: text.trim() });

      io.to('admins').emit('agent:user_message', { room: r, text: text.trim(), ts: new Date().toISOString() });
      io.to(r).emit('agent:echo_user', { text: text.trim(), ts: new Date().toISOString() });
    });

    // ADMIN -> reply
    socket.on('agent:admin_reply', async ({ room: r, text }) => {
      if (!r || !text?.trim()) return;
      await ChatRoom.updateOne(
        { roomId: r },
        { $set: { lastMsgAt: new Date(), unread: 0 } },
        { upsert: true }
      );
      await ChatMessage.create({ roomId: r, role: 'admin', text: text.trim(), ts: new Date() });

      io.to(r).emit('agent:admin_reply', { text: text.trim(), ts: new Date().toISOString() });
    });

    // ADMIN -> request user email  
    socket.on('agent:request_email', async ({ room: r }) => {
      if (!r) return;
      // Save a system message for transcript
      await ChatMessage.create({
        roomId: r,
        role: 'system',
        text: 'Admin requested your email to follow-up.',
        ts: new Date()
      });
      await ChatRoom.updateOne(
        { roomId: r },
        { $set: { lastMsgAt: new Date() } },
        { upsert: true }
      );
      // Broadcast to the user room (user widget listens and shows email capture)
      io.to(r).emit('agent:request_email', { room: r, ts: new Date().toISOString() });
      // Also echo to admins so console shows a system line
      io.to('admins').emit('agent:system', {
        room: r,
        text: 'Email request sent to the user.',
        ts: new Date().toISOString()
      });
    });

    // AGENT -> reply (if you use server-generated agent)
    socket.on('agent:agent_reply', async ({ room: r, text }) => {
      if (!r || !text?.trim()) return;
      await ChatMessage.create({ roomId: r, role: 'agent', text: text.trim(), ts: new Date() });
      io.to(r).emit('agent:agent_reply', { text: text.trim(), ts: new Date().toISOString() });
    });

    // USER ended chat
    socket.on('agent:user_end', async ({ room: r }) => {
      if (!r) return;
      io.to('admins').emit('agent:user_ended', { room: r, ts: new Date() });
      io.to(r).emit('agent:user_ended', { room: r, ts: new Date() });
    });

    socket.on('disconnect', () => {});
  });
}

attachAgentSocket.broadcastPresence = broadcastPresence;

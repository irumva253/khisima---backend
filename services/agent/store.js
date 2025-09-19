// services/agent/store.js
import { randomUUID } from 'crypto';

const rooms = new Map(); // roomId -> { messages, lastMsgAt, unread }
let adminOnline = false;

export function ensureRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { messages: [], lastMsgAt: null, unread: 0 });
  }
  return rooms.get(roomId);
}

export function addMessage(roomId, msg) {
  const r = ensureRoom(roomId);
  const message = {
    id: randomUUID?.() || Math.random().toString(36).slice(2),
    role: msg.role,
    text: msg.text,
    ts: msg.ts || new Date().toISOString(),
  };
  r.messages.push(message);
  r.lastMsgAt = message.ts;
  if (msg.role === 'user') r.unread += 1;
  return message;
}

export function getHistory(roomId) {
  return ensureRoom(roomId).messages;
}

export function markRead(roomId) {
  ensureRoom(roomId).unread = 0;
}

export function listRooms() {
  return Array.from(rooms.entries()).map(([room, data]) => ({
    room,
    lastMsgAt: data.lastMsgAt,
    unread: data.unread,
  }));
}

export function setAdminOnline(val) {
  adminOnline = !!val;
}
export function isAdminOnline() {
  return adminOnline;
}

// Inbox queue for email follow-up
const inbox = [];
export function enqueueInbox({ room, email, question }) {
  const item = {
    id: randomUUID?.() || Math.random().toString(36).slice(2),
    room,
    email,
    question,
    ts: new Date().toISOString(),
    status: 'queued',
  };
  inbox.push(item);
  return item;
}
export function getInbox() {
  return inbox.slice().reverse();
}

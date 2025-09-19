// backend/controllers/agentController.js
import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import nodemailer from 'nodemailer';

import AdminPresence from '../models/AdminPresence.js';
import ChatRoom from '../models/ChatRoom.js';
import ChatMessage from '../models/ChatMessage.js';
import InboxItem from '../models/InboxItem.js';

import { quickAnswer } from '../services/agent/quickAnswer.js';
import { wikiAnswer } from '../services/agent/wikiAnswer.js';
import { siteSearch } from '../services/agent/siteSearch.js';

/* ---------------- Validation ---------------- */
export const searchSchema = Joi.object({
  q: Joi.string().min(2).max(200).required(),
  room: Joi.string().min(6).max(200).optional(),
});

export const inboxSchema = Joi.object({
  room: Joi.string().min(6).max(200).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  question: Joi.string().min(6).max(2000).required(),
});

/* ---------------- Mailer (self-contained) ---------------- */
function makeTransporter() {
  const port = parseInt(process.env.EMAIL_PORT || '465', 10);
  const secure = port === 465;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
}

async function sendHtmlEmail({ to, subject, html }) {
  const transporter = makeTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const info = await transporter.sendMail({ from, to, subject, html });
  return info?.messageId || 'sent';
}

/* ---------------- Public: AI search ---------------- */
export async function searchAgent(req, res) {
  const { error, value } = searchSchema.validate(req.query);
  if (error) return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });

  const q = value.q.trim();

  const quick = quickAnswer(q);
  if (quick) return res.json({ answer: quick, source: 'quick' });

  try {
    const wiki = await wikiAnswer(q);
    if (wiki) return res.json({ answer: wiki, source: 'wiki' });
  } catch {}

  try {
    const site = await siteSearch(q);
    if (site?.answer) return res.json({ ...site, source: 'khisima' });
  } catch {}

  return res.json({});
}

/* ---------------- Public: inbox capture ---------------- */
export async function createInbox(req, res) {
  const { error, value } = inboxSchema.validate(req.body);
  if (error) return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });

  // use key: 'global' (not findById)
  const presence = await AdminPresence.findOne({ key: 'global' });
  if (presence?.online) {
    return res.status(StatusCodes.CONFLICT).json({ message: 'Admin is online; continue in chat.' });
  }

  const item = await InboxItem.create({
    room: value.room,
    email: value.email.toLowerCase().trim(),
    question: value.question.trim(),
    status: 'queued',
  });

  return res.status(StatusCodes.OK).json({ ok: true, id: item._id });
}

/* ---------------- Presence (public GET, admin PUT) ---------------- */
export async function getPresence(req, res) {
  // consistent with sockets/model
  const doc = await AdminPresence.findOne({ key: 'global' });
  res.json({ online: !!doc?.online });
}

export async function setPresence(req, res) {
  const next = !!req.body?.online;

  // consistent upsert on key: 'global'
  await AdminPresence.updateOne(
    { key: 'global' },
    { $set: { online: next, updatedAt: new Date() } },
    { upsert: true }
  );

  // Broadcast via socket.io if available
  try {
    const io = req.app.get('io');
    if (io) io.emit('agent:admin_status', { online: next });
  } catch {}

  res.json({ online: next });
}

/* ---------------- Admin: Rooms ---------------- */
export async function listRooms(req, res) {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '20', 10)));
  const search = String(req.query.search || '').trim();

  const match = search ? { roomId: { $regex: search, $options: 'i' } } : {};
  const [items, total] = await Promise.all([
    ChatRoom.find(match).sort({ lastMsgAt: -1 }).skip((page - 1) * limit).limit(limit),
    ChatRoom.countDocuments(match),
  ]);

  res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function getRoomMessages(req, res) {
  const roomId = req.params.roomId;
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.max(1, Math.min(500, parseInt(req.query.limit || '200', 10)));

  const [items, total] = await Promise.all([
    ChatMessage.find({ roomId }).sort({ ts: 1 }).skip((page - 1) * limit).limit(limit),
    ChatMessage.countDocuments({ roomId }),
  ]);

  await ChatRoom.updateOne({ roomId }, { $set: { unread: 0 } });

  res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function forwardTranscript(req, res) {
  const roomId = String(req.params.roomId || '').trim();
  const { to, subject } = req.body || {};
  if (!roomId) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'roomId required' });
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Valid "to" email is required' });
  }

  const messages = await ChatMessage.find({ roomId }).sort({ ts: 1 });
  const htmlMsgs = messages.map((m) => {
    const who = m.role === 'admin' ? 'Admin' : m.role === 'user' ? 'User' : (m.role || 'Agent');
    const when = m.ts ? new Date(m.ts).toLocaleString('en-US', { timeZone: 'Africa/Kigali' }) : '';
    const text = String(m.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;"><b>${who}</b></td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${when}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${text}</td>
      </tr>`;
  }).join('');

  const html = `
    <div style="font-family:Arial,sans-serif">
      <h2 style="margin:0 0 8px">Chat Transcript — Room ${roomId}</h2>
      <p>Generated by Khisima AI Agent.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:14px">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border-bottom:2px solid #333">Sender</th>
            <th style="text-align:left;padding:8px;border-bottom:2px solid #333">Time</th>
            <th style="text-align:left;padding:8px;border-bottom:2px solid #333">Message</th>
          </tr>
        </thead>
        <tbody>${htmlMsgs || '<tr><td colspan="3" style="padding:8px">No messages</td></tr>'}</tbody>
      </table>
    </div>
  `;

  try {
    const messageId = await sendHtmlEmail({
      to,
      subject: subject || `Chat transcript — Room ${roomId}`,
      html,
    });
    res.json({ ok: true, messageId });
  } catch (err) {
    console.error('forwardTranscript mail error:', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Email send failed' });
  }
}

export async function deleteRoom(req, res) {
  const roomId = String(req.params.roomId || '').trim();
  if (!roomId) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'roomId required' });

  await Promise.all([
    ChatMessage.deleteMany({ roomId }),
    ChatRoom.deleteOne({ roomId }),
  ]);

  res.json({ ok: true });
}

/* ---------------- Admin: Inbox ---------------- */
export async function listInbox(req, res) {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '20', 10)));
  const status = String(req.query.status || '').trim();

  const match = status ? { status } : {};
  const [items, total] = await Promise.all([
    InboxItem.find(match).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    InboxItem.countDocuments(match),
  ]);

  res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function updateInboxStatus(req, res) {
  const id = req.params.id;
  const status = String(req.body.status || '').trim();
  if (!['queued', 'in_progress', 'done'].includes(status)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid status' });
  }
  const doc = await InboxItem.findByIdAndUpdate(id, { $set: { status } }, { new: true });
  if (!doc) return res.status(StatusCodes.NOT_FOUND).json({ message: 'Not found' });
  res.json(doc);
}

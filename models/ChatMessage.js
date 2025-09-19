// backend/models/ChatMessage.js
import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    role: { type: String, enum: ['user', 'agent', 'admin', 'system'], required: true },
    text: { type: String, default: '' },
    ts: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);
export default ChatMessage;

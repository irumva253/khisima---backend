// backend/models/InboxItem.js
import mongoose from 'mongoose';

const InboxItemSchema = new mongoose.Schema(
  {
    room: { type: String, required: true, index: true },
    email: { type: String, required: true, index: true },
    question: { type: String, required: true },
    status: { type: String, enum: ['queued', 'in_progress', 'done'], default: 'queued' },
  },
  { timestamps: true, versionKey: false }
);

const InboxItem = mongoose.model('InboxItem', InboxItemSchema);
export default InboxItem;

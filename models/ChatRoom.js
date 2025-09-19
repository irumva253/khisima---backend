// backend/models/ChatRoom.js
import mongoose from 'mongoose';

const ChatRoomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    lastMsgAt: { type: Date, default: Date.now },
    unread: { type: Number, default: 0 }, // unread for admin
  },
  { timestamps: true, versionKey: false }
);

const ChatRoom = mongoose.model('ChatRoom', ChatRoomSchema);
export default ChatRoom;

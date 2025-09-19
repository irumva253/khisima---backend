// backend/models/AdminPresence.js
import mongoose from 'mongoose';

const AdminPresenceSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, index: true, default: 'global' },
    online: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

AdminPresenceSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const AdminPresence = mongoose.model('AdminPresence', AdminPresenceSchema);
export default AdminPresence;

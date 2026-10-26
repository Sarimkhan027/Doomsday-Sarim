import mongoose from 'mongoose';

const matchPlayerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  eliminations: {
    type: Number,
    default: 0,
    min: 0
  },
  survivedSeconds: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  _id: false
});

const matchSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  map: {
    type: String,
    enum: ['training-island'],
    default: 'training-island'
  },
  startedAt: {
    type: Date,
    required: true
  },
  endedAt: {
    type: Date,
    required: true
  },
  players: {
    type: [matchPlayerSchema],
    default: []
  },
  winnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('Match', matchSchema);
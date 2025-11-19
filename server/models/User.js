import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  passwordHash: {
    type: String,
    required: [true, 'Please add a password'],
    select: false, // Do not return password hash by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },
  postsCompleted: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Create 2dsphere index for location for efficient geo-queries
userSchema.index({ location: '2dsphere' });

const User = mongoose.model('User', userSchema);

export default User;

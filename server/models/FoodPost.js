import mongoose from 'mongoose';

const foodPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  quantity: {
    type: String,
    required: [true, 'Quantity is required (e.g., "1 loaf", "5 apples")'],
  },
  category: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    required: [true, 'An address or pickup location is required'],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  expiresAt: {
    type: Date,
    required: [true, 'An expiration date is required'],
  },
  status: {
    type: String,
    enum: ['available', 'claimed', 'expired', 'completed'],
    default: 'available',
  },
}, {
  // This option adds `createdAt` and `updatedAt` fields automatically
  timestamps: true,
});

// Add a 2dsphere index to support geospatial queries
foodPostSchema.index({ location: '2dsphere' });

const FoodPost = mongoose.model('FoodPost', foodPostSchema);

export default FoodPost;

import mongoose from 'mongoose';

const foodItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for the food item'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  expiryDate: {
    type: Date,
    required: [true, 'Please provide an expiry date'],
  },
  imageUrl: {
    type: String,
    default: 'https://via.placeholder.com/150' // Default placeholder image
  },
  status: {
    type: String,
    enum: ['available', 'claimed', 'expired', 'completed'],
    default: 'available',
  },
  donor: {
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
}, {
  timestamps: true,
});

// Index for geospatial queries
foodItemSchema.index({ location: '2dsphere' });

// Index to quickly find available, unexpired items
foodItemSchema.index({ status: 1, expiryDate: 1 });

const FoodItem = mongoose.model('FoodItem', foodItemSchema);

export default FoodItem;

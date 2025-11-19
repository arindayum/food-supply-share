import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodPost',
    required: true,
  },
  // The user who is submitting the rating (the claimer)
  rater: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // The user being rated (the donor)
  ratee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stars: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
  },
}, { 
  timestamps: true,
  indexes: [
    // A user should only be able to rate a post once
    { fields: { post: 1, rater: 1 }, unique: true }
  ]
});

const Rating = mongoose.model('Rating', ratingSchema);
export default Rating;

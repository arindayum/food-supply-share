import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  // A conversation is uniquely identified by the food post it's associated with.
  // This could be a FoodItem or a FoodPost, so we store the ID and the model type.
  relatedPostId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  postModel: {
    type: String,
    required: true,
    enum: ['FoodItem', 'FoodPost'],
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { 
  timestamps: true,
  // Create a unique compound index to prevent duplicate conversations for the same post
  indexes: [
    { fields: { relatedPostId: 1, postModel: 1 }, unique: true }
  ]
});

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;

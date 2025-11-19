import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import FoodItem from '../models/FoodItem.js';
import FoodPost from '../models/FoodPost.js';

const router = express.Router();

// @desc    Get all conversations for the logged-in user
// @route   GET /api/chat
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const conversations = await Conversation.find({ participants: req.user.id })
            .populate('participants', 'name')
            .populate('relatedPostId', 'title name'); // Populate post title/name from either model
        res.json(conversations);
    } catch (error) {
        console.error("Error fetching user chats:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});


// @desc    Get or create a conversation and its messages for a post
// @route   GET /api/chat/:postModel/:postId
// @access  Private
router.get('/:postModel/:postId', protect, async (req, res) => {
    const { postModel, postId } = req.params;
    const PostModel = postModel === 'FoodItem' ? FoodItem : FoodPost;

    try {
        const post = await PostModel.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const ownerId = post.donor || post.owner;
        const isOwner = ownerId.toString() === req.user.id;
        const isClaimer = post.claimedBy && post.claimedBy.toString() === req.user.id;

        if (!isOwner && !isClaimer) {
            return res.status(401).json({ message: 'Not authorized to access this chat' });
        }

        let conversation = await Conversation.findOne({ relatedPostId: postId, postModel });

        if (!conversation && isOwner && post.claimedBy) {
            // Create conversation only if it doesn't exist and both parties are present
            conversation = new Conversation({
                relatedPostId: postId,
                postModel,
                participants: [ownerId, post.claimedBy],
            });
            await conversation.save();
        }

        if (!conversation) {
            // If no conversation exists (e.g., item not claimed yet), return empty array
            return res.json([]);
        }

        const messages = await Message.find({ conversationId: conversation._id }).populate('sender', 'name');
        res.json(messages);

    } catch (error) {
        console.error("Chat API Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;

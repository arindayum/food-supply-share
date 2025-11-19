import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Rating from '../models/Rating.js';

const router = express.Router();

// @desc    Check if a user has already rated a post
// @route   GET /api/ratings/check/:postId
// @access  Private
router.get('/check/:postId', protect, async (req, res) => {
    try {
        const existingRating = await Rating.findOne({
            post: req.params.postId,
            rater: req.user.id,
        });
        res.json({ hasRated: !!existingRating });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;

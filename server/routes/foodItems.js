import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import FoodItem from '../models/FoodItem.js';
import User from '../models/User.js';

const router = express.Router();

// @desc    Get available food items, with geospatial filtering
// @route   GET /api/fooditems
// @access  Public
router.get('/', async (req, res) => {
  const { lng, lat, radius } = req.query; // radius in kilometers

  try {
    // Base query: find available items that have not expired
    let query = { status: 'available', expiryDate: { $gt: new Date() } };

    // If location data is provided, add a geospatial filter
    if (lng && lat && radius) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseFloat(radius) * 1000, // Convert km to meters
        },
      };
    }

    const foodItems = await FoodItem.find(query).populate('donor', 'name email').sort({ createdAt: -1 });
    res.json(foodItems);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Get a single food item by ID
// @route   GET /api/fooditems/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id).populate('donor', 'name email');
    if (!foodItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    res.json(foodItem);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Food item not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @desc    Create a new food item
// @route   POST /api/fooditems
// @access  Private (requires login)
router.post('/', protect, async (req, res) => {
  const { name, description, expiryDate, imageUrl, location } = req.body;

  try {
    // The user's info is available in req.user from the 'protect' middleware
    const donor = await User.findById(req.user.id);

    const newFoodItem = new FoodItem({
      name,
      description,
      expiryDate,
      imageUrl,
      donor: req.user.id,
      // Use the location from the request body, or fall back to the donor's default location
      location: location || donor.location,
    });

    const foodItem = await newFoodItem.save();
    res.status(201).json(foodItem);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Update a food item
// @route   PUT /api/fooditems/:id
// @access  Private (donor only)
router.put('/:id', protect, async (req, res) => {
    try {
        let foodItem = await FoodItem.findById(req.params.id);

        if (!foodItem) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        // Ensure the user updating the item is the original donor
        if (foodItem.donor.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized to update this item' });
        }

        foodItem = await FoodItem.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Return the modified document
            runValidators: true, // Run schema validators on update
        });

        res.json(foodItem);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Delete a food item
// @route   DELETE /api/fooditems/:id
// @access  Private (donor or admin)
router.delete('/:id', protect, async (req, res) => {
    try {
        const foodItem = await FoodItem.findById(req.params.id);

        if (!foodItem) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        // Ensure user is the donor or an admin
        if (foodItem.donor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'User not authorized to delete this item' });
        }

        await foodItem.deleteOne();

        res.json({ success: true, message: 'Food item removed' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Claim a food item
// @route   POST /api/fooditems/:id/claim
// @access  Private
router.post('/:id/claim', protect, async (req, res) => {
    try {
        const foodItem = await FoodItem.findById(req.params.id);

        if (!foodItem) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        if (foodItem.donor.toString() === req.user.id) {
            return res.status(400).json({ message: 'You cannot claim your own item.' });
        }

        if (foodItem.status !== 'available') {
            return res.status(400).json({ message: `This item is already ${foodItem.status}.` });
        }

        foodItem.status = 'claimed';
        foodItem.claimedBy = req.user.id;

        const updatedFoodItem = await foodItem.save();

        res.json(updatedFoodItem);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Mark a claimed item as completed
// @route   POST /api/fooditems/:id/complete
// @access  Private (claimer only)
router.post('/:id/complete', protect, async (req, res) => {
    try {
        const foodItem = await FoodItem.findById(req.params.id).populate('donor');

        if (!foodItem) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        if (!foodItem.claimedBy || foodItem.claimedBy.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to complete this transaction' });
        }

        if (foodItem.status !== 'claimed') {
            return res.status(400).json({ message: 'This item must be in a "claimed" state to be completed.' });
        }

        foodItem.status = 'completed';

        // Increment the donor's completed posts count
        await User.findByIdAndUpdate(foodItem.donor._id, { $inc: { postsCompleted: 1 } });

        const updatedFoodItem = await foodItem.save();
        res.json(updatedFoodItem);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

export default router;

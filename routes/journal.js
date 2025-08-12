const express = require('express');
const { body, validationResult } = require('express-validator');
const Journal = require('../models/Journal');
const auth = require('../middleware/auth');
const { analyzeSentiment } = require('../utils/sentimentAnalysis');

const router = express.Router();

// @route   POST /api/journal
// @desc    Save a new journal entry
// @access  Private
router.post('/', [
  auth,
  body('content')
    .notEmpty()
    .withMessage('Journal content is required')
    .isLength({ min: 10 })
    .withMessage('Journal entry must be at least 10 characters long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, date } = req.body;
    
    // Analyze sentiment and get mood score
    const moodScore = analyzeSentiment(content);
    
    // Create new journal entry
    const journalEntry = new Journal({
      userId: req.user._id,
      content,
      moodScore,
      date: date || new Date()
    });

    await journalEntry.save();

    res.status(201).json({
      message: 'Journal entry saved successfully',
      entry: {
        id: journalEntry._id,
        content: journalEntry.content,
        moodScore: journalEntry.moodScore,
        date: journalEntry.date,
        createdAt: journalEntry.createdAt
      }
    });

  } catch (error) {
    console.error('Save journal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/journal
// @desc    Get all journal entries for the logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'date' } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sort]: -1 }
    };

    const entries = await Journal.find({ userId: req.user._id })
      .sort({ [sort]: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Journal.countDocuments({ userId: req.user._id });

    res.json({
      entries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalEntries: total,
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/journal/mood-trend
// @desc    Get mood trend data for the last 7 days
// @access  Private
router.get('/mood-trend', auth, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const entries = await Journal.find({
      userId: req.user._id,
      date: { $gte: sevenDaysAgo }
    })
    .sort({ date: 1 })
    .select('moodScore date')
    .lean();

    // Group by date and calculate average mood
    const moodByDate = {};
    entries.forEach(entry => {
      const dateKey = entry.date.toISOString().split('T')[0];
      if (!moodByDate[dateKey]) {
        moodByDate[dateKey] = [];
      }
      moodByDate[dateKey].push(entry.moodScore);
    });

    const moodTrend = Object.keys(moodByDate).map(date => ({
      date,
      averageMood: moodByDate[date].reduce((a, b) => a + b, 0) / moodByDate[date].length
    }));

    res.json({ moodTrend });

  } catch (error) {
    console.error('Get mood trend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/journal/:id
// @desc    Delete a journal entry
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await Journal.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    await Journal.findByIdAndDelete(req.params.id);

    res.json({ message: 'Journal entry deleted successfully' });

  } catch (error) {
    console.error('Delete journal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

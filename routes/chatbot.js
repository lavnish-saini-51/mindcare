const express = require('express');
const { body, validationResult } = require('express-validator');
const Journal = require('../models/Journal');
const auth = require('../middleware/auth');
const { analyzeSentiment } = require('../utils/sentimentAnalysis');

const router = express.Router();

// Mental health tips and suggestions
const mentalHealthTips = {
  negative: [
    "It's okay to not be okay. Consider talking to a trusted friend or family member about how you're feeling.",
    "Try practicing deep breathing exercises - inhale for 4 counts, hold for 4, exhale for 4.",
    "Take a short walk outside. Fresh air and movement can help improve your mood.",
    "Write down three things you're grateful for today, no matter how small.",
    "Consider reaching out to a mental health professional. You don't have to face this alone.",
    "Practice self-compassion. Treat yourself with the same kindness you'd offer a friend.",
    "Try a 5-minute meditation session to center yourself.",
    "Listen to your favorite music or a calming playlist.",
    "Take a warm bath or shower to help relax your body and mind.",
    "Remember that difficult emotions are temporary and will pass."
  ],
  neutral: [
    "Consider exploring a new hobby or activity that interests you.",
    "Try journaling about your goals and aspirations for the future.",
    "Connect with a friend you haven't spoken to in a while.",
    "Practice mindfulness by focusing on the present moment.",
    "Set a small, achievable goal for today and celebrate when you complete it.",
    "Try a new recipe or cook your favorite meal.",
    "Spend some time in nature, even if it's just sitting in a park.",
    "Read a book or article about something that interests you.",
    "Practice gratitude by writing down one good thing that happened today.",
    "Consider learning a new skill or taking an online course."
  ],
  positive: [
    "Great job maintaining a positive outlook! Keep up the good work.",
    "Share your positive energy with others - it can be contagious!",
    "Consider helping someone else today - acts of kindness boost happiness.",
    "Document this good feeling in your journal for future reference.",
    "Use this positive energy to tackle a challenging task.",
    "Celebrate your achievements, no matter how small they may seem.",
    "Consider starting a gratitude practice to maintain this positive mindset.",
    "Share your joy with friends and family.",
    "Use this momentum to set and work toward new goals.",
    "Remember this feeling - you can return to it during difficult times."
  ]
};

// Check for consecutive negative days
const checkNegativePattern = async (userId) => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const recentEntries = await Journal.find({
      userId,
      date: { $gte: threeDaysAgo }
    })
    .sort({ date: -1 })
    .limit(3)
    .lean();

    if (recentEntries.length >= 3) {
      const lastThreeDays = recentEntries.slice(0, 3);
      const allNegative = lastThreeDays.every(entry => entry.moodScore === -1);
      
      if (allNegative) {
        return {
          pattern: true,
          message: "I notice you've been feeling down for the past few days. This is completely normal, but it might be helpful to reach out for support. Consider talking to a friend, family member, or mental health professional. Remember, you're not alone in this journey."
        };
      }
    }

    return { pattern: false };
  } catch (error) {
    console.error('Check negative pattern error:', error);
    return { pattern: false };
  }
};

// @route   POST /api/chatbot
// @desc    Get AI-powered mental health suggestions
// @access  Private
router.post('/', [
  auth,
  body('journalText')
    .notEmpty()
    .withMessage('Journal text is required')
    .isLength({ min: 10 })
    .withMessage('Journal text must be at least 10 characters long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { journalText } = req.body;
    
    // Analyze sentiment
    const moodScore = analyzeSentiment(journalText);
    
    // Check for negative pattern
    const patternCheck = await checkNegativePattern(req.user._id);
    
    // Get appropriate tips based on mood
    let moodCategory = 'neutral';
    if (moodScore === 1) moodCategory = 'positive';
    else if (moodScore === -1) moodCategory = 'negative';
    
    const tips = mentalHealthTips[moodCategory];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    
    // Prepare response
    let response = {
      moodScore,
      moodCategory,
      suggestion: randomTip,
      patternAlert: null
    };
    
    // Add pattern alert if detected
    if (patternCheck.pattern) {
      response.patternAlert = patternCheck.message;
    }
    
    // Add mood-specific insights
    if (moodScore === -1) {
      response.insight = "I sense you might be going through a difficult time. Remember that it's okay to feel this way, and seeking support is a sign of strength.";
    } else if (moodScore === 1) {
      response.insight = "It's wonderful to see you in such a positive state! This energy can be a great foundation for personal growth and helping others.";
    } else {
      response.insight = "You seem to be in a balanced state of mind. This is a great opportunity to reflect on your goals and aspirations.";
    }

    res.json(response);

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chatbot/tips
// @desc    Get random mental health tips
// @access  Private
router.get('/tips', auth, async (req, res) => {
  try {
    const { category = 'neutral' } = req.query;
    
    if (!mentalHealthTips[category]) {
      return res.status(400).json({ message: 'Invalid category' });
    }
    
    const tips = mentalHealthTips[category];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    
    res.json({
      tip: randomTip,
      category
    });

  } catch (error) {
    console.error('Get tips error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;



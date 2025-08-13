// Simple keyword-based sentiment analysis
const positiveWords = [
  'happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'fantastic', 'excellent',
  'good', 'positive', 'love', 'like', 'enjoy', 'pleased', 'satisfied', 'content',
  'peaceful', 'calm', 'relaxed', 'grateful', 'blessed', 'lucky', 'fortunate',
  'success', 'achievement', 'progress', 'improvement', 'growth', 'learning',
  'smile', 'laugh', 'fun', 'enjoyable', 'beautiful', 'perfect', 'awesome'
];

const negativeWords = [
  'sad', 'depressed', 'angry', 'frustrated', 'anxious', 'worried', 'scared', 'afraid',
  'terrible', 'awful', 'horrible', 'bad', 'negative', 'hate', 'dislike', 'upset',
  'disappointed', 'hurt', 'pain', 'suffering', 'struggle', 'difficult', 'hard',
  'stress', 'pressure', 'overwhelmed', 'exhausted', 'tired', 'lonely', 'alone',
  'hopeless', 'helpless', 'worthless', 'useless', 'failure', 'defeat', 'loss',
  'cry', 'tears', 'sadness', 'grief', 'sorrow', 'misery', 'despair'
];

const analyzeSentiment = (text) => {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach(word => {
    // Remove punctuation
    const cleanWord = word.replace(/[^\w]/g, '');
    
    if (positiveWords.includes(cleanWord)) {
      positiveCount++;
    } else if (negativeWords.includes(cleanWord)) {
      negativeCount++;
    }
  });

  // Calculate sentiment score
  if (positiveCount === 0 && negativeCount === 0) {
    return 0; // Neutral
  }

  const total = positiveCount + negativeCount;
  const score = (positiveCount - negativeCount) / total;

  // Normalize to -1, 0, 1
  if (score > 0.2) return 1;      // Positive
  if (score < -0.2) return -1;    // Negative
  return 0;                       // Neutral
};

module.exports = { analyzeSentiment };


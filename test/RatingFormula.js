function calculateRatingForWinner(ratingOfPlayer, ratingOpp, actualScore, K) {
    // Calculate the expected score
    const expectedScore = 1 / (1 + 10 ** ((ratingOpp - ratingOfPlayer) / 400));
    
    // Calculate the rating change
    const ratingChange = K * (actualScore - expectedScore);
    
    // Calculate the new rating
    const newRating = ratingOfPlayer + ratingChange;
    
    return newRating;
}

// Example usage
const ratingOfPlayer = 1500;
const ratingOpp = 1600;
const actualScore = 1; // 1 for a win, 0.5 for a draw, 0 for a loss
const K = 20;

const newRating = calculateRatingForWinner(ratingOfPlayer, ratingOpp, actualScore, K);
console.log(Math.floor(newRating));

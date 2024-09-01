const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: true
  },
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  round: {
    type: Number,
    required: true
  },
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  loser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  result: {
    type: String,
    enum: ['completed', 'draw', 'pending'],
    default: 'pending'
  }
});

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;



const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  buchholz: {
    type: Number,
    default: 0
  },
  sonnebornBerger: {
    type: Number,
    default: 0
  }
});

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;



// Sort players by score
function sortPlayersByScore(players) {
    return players.sort((a, b) => b.score - a.score);
  }

async function pairPlayers(players, tournamentId) {
    const sortedPlayers = sortPlayersByScore(players);
    const pairs = [];
    const usedPlayers = new Set();
  
    for (let i = 0; i < sortedPlayers.length; i++) {
      const player1 = sortedPlayers[i];
      if (usedPlayers.has(player1.userId.toString())) continue;
  
      for (let j = i + 1; j < sortedPlayers.length; j++) {
        const player2 = sortedPlayers[j];
        if (usedPlayers.has(player2.userId.toString())) continue;
  
        // Check if these players have already been paired in any previous round
        const previousMatch = await Match.findOne({
          tournamentId,
          $or: [
            { user1: player1.userId, user2: player2.userId },
            { user1: player2.userId, user2: player1.userId }
          ]
        });
  
        // If no previous match exists, pair them together
        if (!previousMatch) {
          pairs.push([player1, player2]);
          usedPlayers.add(player1.userId.toString());
          usedPlayers.add(player2.userId.toString());
          break;
        }
      }
    }
  
    // If any player is left unpaired (odd number of players), handle the bye (optional)
  
    return pairs;
  }
  

  router.post('/tournament/:tournamentId/round', async (req, res) => {
    const { tournamentId } = req.params;
    const round = parseInt(req.body.round);
  
    try {
      const players = await Player.find({ tournamentId });
      const pairs = await pairPlayers(players, tournamentId);
  
      const matchPromises = pairs.map(([player1, player2], index) => {
        const match = new Match({
          matchId: `${tournamentId}-${round}-${index + 1}`,
          tournamentId,
          round,
          user1: player1.userId,
          user2: player2.userId
        });
        return match.save();
      });
  
      await Promise.all(matchPromises);
      res.status(200).json({ message: 'Round started successfully', pairs });
    } catch (err) {
      res.status(500).json({ message: 'Error starting round', error: err.message });
    }
  });
  
  module.exports = router;
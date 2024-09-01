const Tournament = require('../models/tournament');
const Player = require('../models/player');
const Round = require('../models/round');
const Match = require('../models/match');

// Register a player for a tournament
exports.registerPlayer = async (req, res) => {
  const { tournamentId } = req.params;
  const { playerId } = req.body;

  try {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ message: 'Player not found' });

    if (tournament.players.includes(playerId)) return res.status(400).json({ message: 'Player already registered' });

    tournament.players.push(playerId);
    await tournament.save();

    res.status(200).json({ message: 'Player registered successfully', tournament });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Start the tournament
const Tournament = require('../models/tournament');
const Round = require('../models/round');
const Match = require('../models/match');
const { pairPlayersForRound } = require('./pairingUtils'); // Assume pairingUtils handles pairing logic

// Start the tournament
exports.startTournament = async (req, res) => {
  const { tournamentId } = req.params;

  try {
    const tournament = await Tournament.findById(tournamentId).populate('players');
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    if (tournament.players.length < 2) return res.status(400).json({ message: 'Not enough players to start the tournament' });

    tournament.status = 'ongoing';
    await tournament.save();

    let roundNumber = 1;
    const roundDuration = 3 * 60 * 1000; // 3 minutes in milliseconds

    const scheduleNextRound = async () => {
      if (tournament.status === 'completed') return;

      const round = await Round.create({ roundNumber });
      await pairPlayersForRound(tournament, round);
      tournament.rounds.push(round);
      await tournament.save();
      
      roundNumber++;

      if (roundNumber <= 5) { // Assuming 5 rounds; adjust as needed
        setTimeout(scheduleNextRound, roundDuration); // Schedule the next round after the fixed duration
      } else {
        tournament.status = 'completed';
        await tournament.save();
      }
    };

    scheduleNextRound(); // Start the first round

    res.status(200).json({ message: 'Tournament started successfully', tournament });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Pair players for a round
const Match = require('../models/match');

// Pair players for a round
exports.pairPlayersForRound = async (tournament, round) => {
  let players = [...tournament.players];
  players.sort((a, b) => b.score - a.score || b.buchholz - a.buchholz); // Sort by score, then Buchholz

  const pairedPlayers = new Set();
  const matchups = new Set(); // To track player pairs and avoid rematches

  while (players.length > 1) {
    const player1 = players.shift();
    let player2 = players.find(p => !pairedPlayers.has(p._id) && player1._id.toString() !== p._id.toString() && !matchups.has(`${player1._id}-${p._id}`) && !matchups.has(`${p._id}-${player1._id}`));

    if (!player2) {
      players.unshift(player1);
      break;
    }

    players = players.filter(p => p._id.toString() !== player2._id.toString());
    pairedPlayers.add(player1._id);
    pairedPlayers.add(player2._id);

    // Create a match and record the pairing
    const match = await Match.create({ round: round._id, player1: player1._id, player2: player2._id, result: 'pending' });
    round.matches.push(match);
    matchups.add(`${player1._id}-${player2._id}`);
  }

  await round.save();
};


// Calculate Buchholz scores
const calculateBuchholz = async (tournament) => {
  for (const player of tournament.players) {
    const matches = await Match.find({ $or: [{ player1: player._id }, { player2: player._id }] }).populate('player1').populate('player2');
    
    let buchholzScore = 0;
    for (const match of matches) {
      let opponent = match.player1._id.toString() === player._id.toString() ? match.player2 : match.player1;
      buchholzScore += (await Player.findById(opponent)).score;
    }
    
    player.buchholz = buchholzScore;
    await player.save();
  }
};

// Calculate Sonneborn-Berger scores
const calculateSonnebornBerger = async (tournament) => {
  for (const player of tournament.players) {
    const matches = await Match.find({ $or: [{ player1: player._id }, { player2: player._id }] }).populate('player1').populate('player2');
    
    let sonnebornBergerScore = 0;
    for (const match of matches) {
      let opponent = match.player1._id.toString() === player._id.toString() ? match.player2 : match.player1;
      let outcome = match.result === 'draw' ? 0.5 : (match.result === (player._id.toString() === match.player1._id.toString() ? 'player1_win' : 'player2_win') ? 1 : 0);
      sonnebornBergerScore += outcome * (await Player.findById(opponent)).score;
    }
    
    player.sonnebornBerger = sonnebornBergerScore;
    await player.save();
  }
};

// Submit match results
exports.submitResult = async (req, res) => {
  const { matchId } = req.params;
  const { result } = req.body;

  try {
    const match = await Match.findById(matchId).populate('player1').populate('player2');
    if (!match) return res.status(404).json({ message: 'Match not found' });

    if (!['player1_win', 'player2_win', 'draw'].includes(result)) return res.status(400).json({ message: 'Invalid result' });

    // Update match result
    match.result = result;
    await match.save();

    // Update player scores
    const [player1, player2] = [match.player1, match.player2];
    if (result === 'player1_win') {
      player1.score += 1;
    } else if (result === 'player2_win') {
      player2.score += 1;
    } else if (result === 'draw') {
      player1.score += 0.5;
      player2.score += 0.5;
    }

    await player1.save();
    await player2.save();

    // Recalculate tiebreaker scores
    const tournament = await Tournament.findById(match.round).populate('players');
    await calculateBuchholz(tournament);
    await calculateSonnebornBerger(tournament);

    res.status(200).json({ message: 'Match result submitted successfully', match });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, default: 1500 },
  score: { type: Number, default: 0 },
  buchholz: { type: Number, default: 0 },
  sonnebornBerger: { type: Number, default: 0 },
  matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }]
});

const Player = mongoose.model('Player', playerSchema);
module.exports = Player;


const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  round: { type: mongoose.Schema.Types.ObjectId, ref: 'Round', required: true },
  player1: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  player2: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  result: { type: String, enum: ['player1_win', 'player2_win', 'draw', 'pending'], default: 'pending' },
  date: { type: Date, default: Date.now }
});

const Match = mongoose.model('Match', matchSchema);
module.exports = Match;


const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  roundNumber: { type: Number, required: true },
  matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],
  date: { type: Date, default: Date.now }
});

const Round = mongoose.model('Round', roundSchema);
module.exports = Round;

const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  rounds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Round' }],
  status: { type: String, enum: ['ongoing', 'completed'], default: 'ongoing' }
});

const Tournament = mongoose.model('Tournament', tournamentSchema);
module.exports = Tournament;



const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const playerSchema = new mongoose.Schema({
    name: String,
    score: { type: Number, default: 0 },
    buchholz: { type: Number, default: 0 },
    sonnebornBerger: { type: Number, default: 0 },
    tournamentId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament'
    },
     user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('Player', playerSchema);


const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
    tournamentName: String,
    status: { type: String, enum: ['pending', 'ongoing', 'completed'], default: 'pending' },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    rounds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Round' }],
    noOfRounds:{
        type:Number
    },
    noOfplayers:{
        type:Number,
        default:10
    },
    createdBy:{
        type: String,
        required: true
    },
    status:{
        type: String,
        default:"Pending"
    },
    entryFees: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    topThreePlayer: {
        type: [String]
    },
    tournamentName: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    JoinedPlayerList:{
        type: [Object]
    },
    tournamentIsJoin:{
        type:Boolean,
        default:false
    },
});

module.exports = mongoose.model('Tournament', tournamentSchema);


const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
    roundNumber: Number,
    matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],
});

module.exports = mongoose.model('Round', roundSchema);


const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    round: { type: mongoose.Schema.Types.ObjectId, ref: 'Round' },
    player1: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    player2: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    result: { type: String, enum: ['player1_win', 'player2_win', 'draw', 'pending'], default: 'pending' },
});

module.exports = mongoose.model('Match', matchSchema);

// -----------------------------------------
const Tournament = require('../models/Tournament');
const Round = require('../models/Round');
const Match = require('../models/Match');
const { pairPlayersForRound } = require('./pairingUtils');
const { calculateBuchholz, calculateSonnebornBerger } = require('../utils/scoringUtils');
const axios = require('axios');


exports.joinTournament = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const userId = req.user._id;

        // Fetch the tournament
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            return res.status(404).json({
                success: false,
                message: "Tournament not found."
            });
        }

        // Check if the user is already a participant
        if (tournament.JoinedPlayerList.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: "User is already a participant in this tournament."
            });
        }

        // Check if the tournament has reached the maximum number of participants
        const maxParticipants = parseInt(tournament.noOfplayers, 10);
        if (tournament.JoinedPlayerList.length >= maxParticipants) {
            tournament.tournamentIsJoin = true;
            await tournament.save();
            return res.status(400).json({
                success: false,
                message: "Tournament reached the maximum number of participants."
            });
        }

        // Create a new Player entry for the user in the tournament
        const newPlayer = new Player({
            name: req.user.name, // Assuming the user's name is available in req.user
            tournamentId: tournament._id
        });

        // Save the new player
        await newPlayer.save();

        // Add the player ID to the tournament's participant list
        tournament.JoinedPlayerList.push(newPlayer._id);
        await tournament.save();

        res.status(200).json({
            success: true,
            data: tournament
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
};

exports.startTournament = async (req, res) => {
    const { tournamentId } = req.params;
    try {
        const tournament = await Tournament.findById(tournamentId).populate('players');
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

        if (tournament.players.length < 2) return res.status(400).json({ message: 'Not enough players to start the tournament' });

        tournament.status = 'ongoing';
        await tournament.save();

        let roundNumber = 1;
        const roundDuration = 10 * 60 * 1000; // 10 minutes in milliseconds
        const breakDuration = 1 * 60 * 1000; // 1 minute in milliseconds

      

const createUniqueUrls = (noOfPlayers, gameTime) => {
    const protocol = "https";
    const host = "dynamo-chess.vercel.app";
    const urls = [];

    // Generate n/2 unique URLs
    const numberOfUrls = Math.floor(noOfPlayers / 2);

    for (let i = 0; i < numberOfUrls; i++) {
        const inputId = uuidv4();
        const url = `${protocol}://${host}/multiplayer/${inputId}/${gameTime}`;
        urls.push(url);
    }

    return urls;
};

// Example usage:
const noOfPlayers = 6;
const gameTime = 150;
const urls = createUniqueUrls(noOfPlayers, gameTime);

console.log(urls);



        const scheduleNextRound = async () => {
            if (tournament.status === 'completed') return;

            const round = await Round.create({ roundNumber });
            await pairPlayersForRound(tournament, round);
            tournament.rounds.push(round);
            await tournament.save();
            setTimeout(()=>{
        //   send urls tp al users
            },60000)


            // Simulate results submission for this round after the duration
            setTimeout(async () => {
                await simulateRoundResults(round._id);
                await calculateBuchholz(tournament);
                await calculateSonnebornBerger(tournament);
                roundNumber++;
                if (roundNumber <= 5) { // Assuming 5 rounds; adjust as needed

                    setTimeout(scheduleNextRound, breakDuration); // Start the next round after the break
                } else {
                    tournament.status = 'completed';
                    await tournament.save();
                    console.log('Tournament completed');
                }
            }, roundDuration);
        };

        scheduleNextRound(); // Start the first round

        res.status(200).json({ message: 'Tournament started successfully', tournament });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const simulateRoundResults = async (roundId) => {
    const round = await Round.findById(roundId).populate('matches');
    for (const match of round.matches) {
        const randomResult = Math.random();
        let result = 'draw';
        if (randomResult < 0.45) {
            result = 'player1_win';
        } else if (randomResult < 0.9) {
            result = 'player2_win';
        }

        await axios.post(`http://localhost:5000/api/matches/${match._id}/result`, { result });
    }
};

const Match = require('../models/Match');

exports.pairPlayersForRound = async (tournament, round) => {
    let players = [...tournament.players];
    players.sort((a, b) => b.score - a.score || b.buchholz - a.buchholz);

    const pairedPlayers = new Set();
    const matchups = new Set();

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

        const match = await Match.create({ round: round._id, player1: player1._id, player2: player2._id, result: 'pending' });
        round.matches.push(match);
        matchups.add(`${player1._id}-${player2._id}`);
    }

    await round.save();
};


exports.calculateBuchholz = async (tournament) => {
    for (const player of tournament.players) {
        const matches = await Match.find({
            $or: [{ player1: player._id }, { player2: player._id }],
            result: { $ne: 'pending' },
        });

        let buchholzScore = 0;

        for (const match of matches) {
            const opponentId = match.player1.toString() === player._id.toString() ? match.player2 : match.player1;
            const opponent = await Player.findById(opponentId);
            buchholzScore += opponent.score;
        }

        player.buchholz = buchholzScore;
        await player.save();
    }
};

exports.calculateSonnebornBerger = async (tournament) => {
    for (const player of tournament.players) {
        const matches = await Match.find({
            $or: [{ player1: player._id }, { player2: player._id }],
            result: { $ne: 'pending' },
        });

        let sbScore = 0;

        for (const match of matches) {
            const opponentId = match.player1.toString() === player._id.toString() ? match.player2 : match.player1;
            const opponent = await Player.findById(opponentId);
            const scoreContribution = match.result === 'draw' ? 0.5 : 1;
            if (match.result === 'player1_win' && match.player1.toString() === player._id.toString()) {
                sbScore += opponent.score * scoreContribution;
            } else if (match.result === 'player2_win' && match.player2.toString() === player._id.toString()) {
                sbScore += opponent.score * scoreContribution;
            }
        }

        player.sonnebornBerger = sbScore;
        await player.save();
    }
};

const mongoose = require("mongoose");


const tournamentSchema = new mongoose.Schema({
    tournamentName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'ongoing', 'completed'],
        default: 'pending'
    },
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
    }],
    rounds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Round'
    }],
    noOfRounds: {
        type: Number
    },
    upComingRound:{
type:Number,
default:1
    },
    noOfplayers: {
        type: Number,
        default: 10
    },
    createdBy: {
        type: String,
        required: true
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
    startDate: {
        type: String,
        required: true
    },
    JoinedPlayerList: {
        type: [Object]
    },
    tournamentIsJoin: {
        type: Boolean,
        default: false
    },
    gameTimeDuration:{
  type:String
    },
    matchesData:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match' 
    }
    
}, {
    versionKey: false
});

module.exports = mongoose.model("TournamentData", tournamentSchema);

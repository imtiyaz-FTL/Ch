const mongoose = require('mongoose');

// Player Schema
const playerSchema = new mongoose.Schema({
    score: { type: Number, default: 1 },
    buchholz: { type: Number, default: 0 },
    sonnebornBerger: { type: Number, default: 0 },
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament'
    },
    user: {
        type:String
    },
    userData: {
        type: Object
    },
    gameUrls:{
type:String
    },
    receivedBye: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Player', playerSchema);

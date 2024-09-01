const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
    round: { type: mongoose.Schema.Types.ObjectId, ref: 'Round' },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
    player1: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    player2: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // Add user1 reference
  user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // Add user2 reference
    winner: { type: String ,default:"null"},
    loser: { type: String,default:"null" },
    result: { type: String,  default: 'pending' },
    url: { type: String, required: true }, // URL field to store the unique match URL
   gameTypeWin:{
    type:String,
    default:"Draw"
   }
},
{ versionKey: false }
);

module.exports = mongoose.model('Match', matchSchema);

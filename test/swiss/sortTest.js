let players=[
{
    _id:1,
    score:3,
    bucckolz:3,
    receivedBye:false
},
{
    _id:2,
    score:2,
    bucckolz:4,
    receivedBye:false
},
{
    _id:3,
    score:2,
    bucckolz:2,
    receivedBye:true
},
{
    _id:4,
    score:2,
    bucckolz:2,
    receivedBye:false
},
{
    _id:5,
    score:2,
    bucckolz:1,
    receivedBye:true
},

]

const sortedPlayers =players.sort((a,b)=>b.score-a.score||b.bucckolz-a.bucckolz);
if (sortedPlayers.length % 2 !== 0) {
    console.log(sortedPlayers)
    let byePlayerIndex = sortedPlayers.length - 1;
    
    
    // Find the first player who hasn't received a bye
    while (byePlayerIndex >= 0 && sortedPlayers[byePlayerIndex].receivedBye) {
        console.log(sortedPlayers[byePlayerIndex].receivedBye)
      byePlayerIndex--;
    }
    if (byePlayerIndex >= 0) {
      const byePlayer = sortedPlayers.splice(byePlayerIndex, 1)[0]; // Remove the player from sortedPlayers


      console.log(byePlayer)
    }
  }


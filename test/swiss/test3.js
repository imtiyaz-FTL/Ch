let playersData=[
    {
        _id: "player1",
        name: "Player 1",
        score: 10,
        buchholz: 15
    },
    {
        _id: "player2",
        name: "Player 2",
        score: 190,
        buchholz: 10
    },
    {
        _id: "player3",
        name: "Player 3",
        score: 80,
        buchholz: 8
    }
]

let players = [...playersData];
console.log(players.shift(),"llll")
players.sort((a, b) => b.score - a.score || b.buchholz - a.buchholz);
console.log(players)
// const Tournament = require("../../models/tournamentModel")
const User = require("../../models/userModel");
const mongoose = require("mongoose");
const PlayersTournament = require("../../models/Tournament/PlayersTournament");
const TournamentModel = require("../../models/Tournament/TournamentModel");
const PairedMatch = require("../../models/Tournament/pairedModel");
const { check, validationResult } = require("express-validator");
const Round = require("../../models/Tournament/Round");
const Match = require("../../models/Tournament/Match");
// const calculateTournamentScores = require("../../utils/scoringUtils");
// const calculateSonnebornBerger = require("../../utils/scoringUtils");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const cron = require("node-cron");
// const moment = require('moment');
// tournamentController.js
// Function to calculate the number of rounds

// sleep function
const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
function calculateRounds(noOfplayers) {
  return Math.ceil(Math.log2(noOfplayers));
}

// calculateTournamentScores = async (tournament) => {
//   for (const playerId of tournament.players) {
//       const player = await PlayersTournament.findById(playerId);
//       if (!player) continue;
//       console.log(player, "+++++999999999999999999999++++++");

//       const matches = await Match.find({
//           $or: [{ user1: player.user }, { user2: player.user }],
//           result: { $ne: 'pending' },
//       });
//       console.log(matches, "+++++15++++++scoringUtils");

//       let buchholzScore = 0;
//       let sbScore = 0;

//       for (const match of matches) {
//           const isWinner = match.winner === player.user;
//           const isLoser = match.loser === player.user;
//           const isDraw = !isWinner && !isLoser;

//           const opponentId = isWinner ? match.loser : match.winner;
//           const opponent = await PlayersTournament.findOne({ user: opponentId });
//           console.log(opponent, "jjjjjjjjjjjjjjjj");

//           if (opponent) {
//               const scoreContribution = isDraw ? 0.5 : 1;

//               // Buchholz Score Calculation
//               buchholzScore += opponent.score;
//               console.log(buchholzScore, "++++++buchholzScore++++");

//               // Sonneborn-Berger Score Calculation
//               if (isWinner) {
//                   sbScore += opponent.score * scoreContribution;
//                   player.score += 1; // Increase winner's score
//                   opponent.score = Math.max(opponent.score , 0); // Decrease loser's score but not below 0
//                   await opponent.save(); // Save the opponent's updated score
//               } else if (isDraw) {
//                   sbScore += (opponent.score * 0.5); // Consider half score for draw in Sonneborn-Berger
//               }
//           }
//       }

//       // Update the player's tournament score
//       player.buchholz = buchholzScore;
//       player.sonnebornBerger = sbScore;
//       await player.save();
//       console.log(player.buchholz, player.sonnebornBerger, "Player scores updated successfully.");
//   }
// };


// +++++++++calculate the score ++++++++++
const calculateTournamentScores = async (tournament) => {
  for (const playerId of tournament.players) {
    const player = await PlayersTournament.findById(playerId);
    if (!player) continue;

    console.log(player, "+++++Player Info++++++");

    // Find all matches where the player participated and the result is not pending
    const matches = await Match.find({
      $or: [{ user1: player.user }, { user2: player.user }],
      result: { $ne: 'pending' },
    });

    console.log(matches, "+++++Matches Info++++++");

    let buchholzScore = 0;
    let sbScore = 0;

    for (const match of matches) {
      if (match.result === 'bye') {
        // Handle bye result
        // player.score += 1; // Player gets a full point for a bye

        continue; // Skip further processing for this match
      }

      const isWinner = match.winner === player.user;
      const isDraw = !isWinner && match.loser !== player.user;

      const opponentId = isWinner ? match.loser : match.winner;
      const opponent = await PlayersTournament.findOne({ user: opponentId });

      console.log(opponent, "+++++Opponent Info++++++");

      if (opponent) {
        // Buchholz Score Calculation: Sum of opponents' scores
        buchholzScore += opponent.score;

        // Sonneborn-Berger Score Calculation
        if (isWinner) {
          sbScore += opponent.score; // Full opponent's score if player won
          player.score += 1; // Increase player's score for a win
        } else if (isDraw) {
          sbScore += opponent.score * 0.5; // Half opponent's score for a draw
        }
        // Opponent's score is adjusted only if the opponent lost
        if (match.loser === opponent.user) {
          opponent.score = Math.max(opponent.score, 0); // Ensure opponent's score doesn't go below 0
          await opponent.save(); // Save the opponent's updated score
        }
      }
    }

    // Update the player's tournament score
    player.buchholz = buchholzScore;
    player.sonnebornBerger = sbScore;
    await player.save();

    console.log(
      player.buchholz,
      player.sonnebornBerger,
      "Player scores updated successfully."
    );
  }
};



//create unique urls
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


// const pairPlayersForRound = async (tournament, round, urls, tournamentId) => {
//   // Fetch player data for the tournament
//   let playersData=await PlayersTournament.findById(tournamentId)
//   console.log(playersData,"7777777777777777777777777777777777777777777777777777777777777777777777")
//   const players = await PlayersTournament.aggregate([
//     {
//         $match: { tournamentId:new mongoose.Types.ObjectId(tournamentId) }
//     },
//     {
//         $project: {
//             user: 1,
//             score: 1,
//             buchholz: 1,
//             sonnebornBerger: 1,
          
//         }
//     }
// ]);


//   console.log(players,"+++++++++0000000000000000000000++++++++++")

//   // Sort players by score, then by Buchholz (additional tiebreakers if needed)
//   let sortedPlayers = players.sort((a, b) => b.score - a.score || b.buchholz - a.buchholz);
  
//   const pairs = [];
//   const usedPlayers = new Set();
//   const matchups = new Set();
//   let urlIndex = 0;

//   // Retrieve all previous matches to avoid repeat pairings
//   const previousMatches = await Match.find({ tournamentId });
//   const previousMatchups = new Set(
//     previousMatches.flatMap(match => [
//       `${match.player1}-${match.player2}`,
//       `${match.player2}-${match.player1}`
//     ])
//   );

//   for (let i = 0; i < sortedPlayers.length; i++) {
//     const player1 = sortedPlayers[i];
//     if (usedPlayers.has(player1.user.toString())) continue;

//     for (let j = i + 1; j < sortedPlayers.length; j++) {
//       const player2 = sortedPlayers[j];
//       if (usedPlayers.has(player2.user.toString())) continue;

//       // Check if these players have already been paired in any previous round
//       const previousMatch = await Match.findOne({
//         tournamentId,
//         $or: [
//           { user1: player1.user, user2: player2.user },
//           { user1: player2.user, user2: player1.user }
//         ]
//       });

//       // If no previous match exists, pair them together
//       if (!previousMatch) {
//         const matchUrl = urls[urlIndex++ % urls.length]; // Assign a unique URL to this match

//         // Create the match
//         const match = await Match.create({
//           round: round._id,
//           tournamentId: tournamentId,
//           player1: player1._id,
//           player2: player2._id,
//           user1: player1.user,
//           user2: player2.user,
//           result: "pending",
//           url: matchUrl,
//         });

//         pairs.push([player1, player2]);
//         usedPlayers.add(player1.user.toString());
//         usedPlayers.add(player2.user.toString());

//         // Add the match to the round
//         round.matches.push(match);
//         previousMatchups.add(`${player1._id}-${player2._id}`);
//         break;
//       }
//     }
//   }

//   // Save the updated round with the new matches
//   await round.save();
// };

//++++++++++code for new pairing++++++++

const pairPlayersForRound = async (tournament, round, urls, tournamentId) => {
  // Fetch player data for the tournament
  const players = await PlayersTournament.aggregate([
    {
      $match: { tournamentId: new mongoose.Types.ObjectId(tournamentId) }
    },
    {
      $project: {
        user: 1,
        score: 1,
        buchholz: 1,
        sonnebornBerger: 1,
        receivedBye: 1 // Include the receivedBye field
      }
    }
  ]);

  // Sort players by score, then by Buchholz
  let sortedPlayers = players.sort((a, b) => b.score - a.score || b.buchholz - a.buchholz);

  const pairs = [];
  const usedPlayers = new Set();
  const matchups = new Set();
  let urlIndex = 0;

  // Retrieve all previous matches to avoid repeat pairings
  const previousMatches = await Match.find({ tournamentId });
  const previousMatchups = new Set(
    previousMatches.flatMap(match => [
      `${match.player1}-${match.player2}`,
      `${match.player2}-${match.player1}`
    ])
  );

  // If the number of players is odd, assign a bye to the last player who hasn't received a bye
  if (sortedPlayers.length % 2 !== 0) {
    let byePlayerIndex = sortedPlayers.length - 1;

    // Find the first player who hasn't received a bye
    while (byePlayerIndex >= 0 && sortedPlayers[byePlayerIndex].receivedBye) {
      byePlayerIndex--;
    }

    if (byePlayerIndex >= 0) {
      const byePlayer = sortedPlayers.splice(byePlayerIndex, 1)[0]; // Remove the player from sortedPlayers

      // Assign a bye and create a "match" with a bye
      const match = await Match.create({
        round: round._id,
        tournamentId: tournamentId,
        player1: byePlayer._id,
        player2: null, // No opponent for a bye
        user1: byePlayer.user,
        user2: null, // No user2 for a bye
        result: "bye",
        url: urls[urlIndex++ % urls.length], // Assign a unique URL
      });

      // The byePlayer gets a full point for the round
      byePlayer.score += 1;
      byePlayer.receivedBye = true;
      await PlayersTournament.updateOne({ _id: byePlayer._id }, { $set: { score: byePlayer.score, receivedBye: true } });

      // Add the match to the round
      round.matches.push(match);

      usedPlayers.add(byePlayer.user.toString());
    }
  }

  // Pair remaining players (code remains the same)
  for (let i = 0; i < sortedPlayers.length; i++) {
    const player1 = sortedPlayers[i];
    if (usedPlayers.has(player1.user.toString())) continue;

    for (let j = i + 1; j < sortedPlayers.length; j++) {
      const player2 = sortedPlayers[j];
      if (usedPlayers.has(player2.user.toString())) continue;

      // Check if these players have already been paired in any previous round
      const previousMatch = await Match.findOne({
        tournamentId,
        $or: [
          { user1: player1.user, user2: player2.user },
          { user1: player2.user, user2: player1.user }
        ]
      });

      // If no previous match exists, pair them together
      if (!previousMatch) {
        const matchUrl = urls[urlIndex++ % urls.length]; // Assign a unique URL to this match

        // Create the match
        const match = await Match.create({
          round: round._id,
          tournamentId: tournamentId,
          player1: player1._id,
          player2: player2._id,
          user1: player1.user,
          user2: player2.user,
          result: "pending",
          url: matchUrl,
        });

        pairs.push([player1, player2]);
        usedPlayers.add(player1.user.toString());
        usedPlayers.add(player2.user.toString());

        // Add the match to the round
        round.matches.push(match);
        previousMatchups.add(`${player1._id}-${player2._id}`);
        break;
      }
    }
  }

  // Save the updated round with the new matches
  await round.save();
};




const simulateRoundResults = async (roundId,tournamentId) => {
  console.log(roundId, "92222222222222222222222");

  // Find all pending matches for the specified round
  const pendingMatches = await Match.aggregate([
    {
      $match: {
        round: roundId,
        result: "pending",
      },
    },
  ]);

  console.log(pendingMatches, "Pending matches");

  // Iterate over each pending match and update the result
  // for (let match of pendingMatches) {
  //   let result = "completed";
  //   await Match.updateOne({ _id: match._id }, { $set: { result } });

  //   console.log(`Match ${match._id} updated with result: ${result}`);
  // }
  const currentTime = new Date();
  const istOffset = 5 * 60 + 30; // IST is UTC+5:30
  const updatedTimeIST = new Date(currentTime.getTime() + istOffset * 60000 + 5 * 60000); // Add 5 minutes to IST

  const hours = updatedTimeIST.getUTCHours().toString().padStart(2, '0');
  const minutes = updatedTimeIST.getUTCMinutes().toString().padStart(2, '0');
  const formattedTime = `${hours}:${minutes}`;

  await TournamentModel.updateOne(
    { _id: tournamentId },
    { $set: { time: formattedTime } }
  );

  console.log(`Tournament ${tournamentId} time updated to: ${updatedTimeIST}`);
};

const createTournament = async (req, res) => {
  try {
    console.log("kakakak");
    const {
      tournamentName,
      startDate,
      entryFees,
      time,
      gameTimeDuration,

      noOfplayers,
    } = req.body;
    console.log(req.body);
    const createdBy = req.user._id;

    // Parse and validate the start date
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date.",
      });
    }

    // Validate entry fees
    const fees = parseFloat(entryFees);
    if (isNaN(fees) || fees < 0) {
      return res.status(400).json({
        success: false,
        message: "Entry fees must be a valid positive number.",
      });
    }

    // Calculate the number of rounds based on the number of players
    const rounds = calculateRounds(noOfplayers || 10);
    console.log(rounds, "lllllll");

    // Create a new tournament
    const tournament = new TournamentModel({
      tournamentName,
      startDate: startDate,
      entryFees: fees.toString(), // Convert to string for consistency
      time,
      topThreePlayer: [],
      JoinedPlayerList: [],
      tournamentIsJoin: false,
      noOfRounds: rounds || 1, // Default to 1 round
      noOfplayers: noOfplayers || 10, // Default to 10 players
      createdBy,
      gameTimeDuration,
    });

    // Save the tournament to the database
    const tournamentData = await tournament.save();

    // Send success response
    return res.status(200).json({
      success: true,
      data: tournamentData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating the tournament.",
      error: error.message,
    });
  }
};
const updateTournament = async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const {
      tournamentName,
      startDate,
      entryFees,
      time,
      topThreePlayer,
      JoinedPlayerList,
      tournamentIsJoin,
      noOfRounds,
      noOfplayers,
      gameTimeDuration,
    } = req.body;

    // Parse startDate as an ISO string
    const start = new Date(startDate);

    // Check if startDate is a valid date
    if (isNaN(start.getTime())) {
      return res.status(400).send({
        success: false,
        message: "Invalid start date.",
      });
    }

    // Check if EntryFees is a valid number (since in the model it's a string, consider converting it)
    const fees = parseFloat(entryFees);
    if (isNaN(fees) || fees < 0) {
      return res.status(400).send({
        success: false,
        message: "Entry fees must be a valid positive number.",
      });
    }
    const rounds = calculateRounds(noOfplayers || 10);

    // Now updating the tournament
    const updatedTournament = await TournamentModel.findByIdAndUpdate(
      tournamentId,
      {
        tournamentName,
        startDate: start,
        entryFees: fees.toString(), // Storing as a string since that's what the schema expects
        time,
        topThreePlayer: topThreePlayer || [],
        JoinedPlayerList: JoinedPlayerList || [],
        tournamentIsJoin: tournamentIsJoin || false,
        noOfRounds: noOfRounds || 1, // Default to 1 round if not provided
        noOfplayers: noOfplayers || 10, // Default to 10 players if not provided
        noOfRounds: rounds,
        gameTimeDuration: gameTimeDuration,
      },
      { new: true }
    );

    if (!updatedTournament) {
      return res.status(404).send({
        success: false,
        message: "Tournament not found.",
      });
    }

    return res.status(200).send({
      success: true,
      data: updatedTournament,
    });
  } catch (error) {
    return res.status(400).send({
      success: false,
      message: error.message,
    });
  }
};
const deleteTournament = async (req, res) => {
  const tournamentId = req.params.id;
  const deletedTournament = await TournamentModel.findByIdAndDelete(
    tournamentId
  );
  res.status(200).json({
    success: true,
    data: deletedTournament,
  });
};
const getMyTournament = async (req, res) => {
  // const userId=req.params.id
  const myTournament = await TournamentModel.aggregate([
    {
      $match: {
        tournamentIsJoin: false,
      },
    },
  ]);
  res.status(200).json({
    success: true,
    data: myTournament,
  });
};
const getTournamentByUserId = async (req, res) => {
  const userId = req.user._id;

  try {
    const tournaments = await TournamentModel.find({
      "JoinedPlayerList.user": userId,
    });

    res.status(200).json({
      success: true,
      data: tournaments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving tournaments.",
      error: error.message,
    });
  }
};
const joinTournament = async (req, res) => {
  const { tournamentId } = req.params;
  const userId = req.user._id;

  try {
    // Fetch the tournament by ID
    let tournament = await TournamentModel.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found.",
      });
    }

    // Check if the user is already a participant
    const userAlreadyInTournament = tournament.JoinedPlayerList.some((player) =>
      player.user.equals(userId)
    );
    if (userAlreadyInTournament) {
      return res.status(400).json({
        success: false,
        message: "User is already a participant in this tournament.",
      });
    }

    // Check if the tournament has reached the maximum number of participants
    const maxParticipants = tournament.noOfplayers;
    if (tournament.JoinedPlayerList.length >= maxParticipants) {
      tournament.tournamentIsJoin = true;
      await tournament.save();
      return res.status(400).json({
        success: false,
        message: "Tournament has reached the maximum number of participants.",
      });
    }
    const userData = await User.findById(userId);
    console.log(userData, "uuuuuuuuuuu");

    // Create a new Player entry
    // const newPlayer = new PlayersTournament({
    //   name: req.user.name, // Assuming the user's name is available in req.user
    //   tournamentId: tournament._id,
    //   user: userId,
    //   userData: userData, // Assuming the user's data is available in req.user
    // });

    // await newPlayer.save(); // Save the player to the database

    // Add the user to the tournament's JoinedPlayerList
    tournament.JoinedPlayerList.push({ user: userId, userData: userData }); // Adjust based on actual data structure
    await tournament.save();

    res.status(200).json({
      success: true,
      data: tournament,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while joining the tournament.",
      error: error.message,
    });
  }
};
const getTournamentById = async (req, res) => {
  const tournamentId = req.params.id;
  try {
    const tournament = await TournamentModel.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    res.status(200).json({
      success: true,
      data: tournament,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the tournament",
      error: error.message,
    });
  }
};
const adminNotification = async (req, res) => {
  try {
    let today = new Date();

    // Format the date to 'YYYY-MM-DD'
    let year = today.getFullYear();
    let month = String(today.getMonth() + 1).padStart(2, "0"); // Ensure two digits for the month
    let day = String(today.getDate()).padStart(2, "0"); // Ensure two digits for the day

    let date = `${year}-${month}-${day}`;
    console.log(date, "kkkkk");

    // Get the current time
    let currentTime =
      today.getHours() + ":" + String(today.getMinutes()).padStart(2, "0");

    // Calculate the time 5 minutes ahead
    let futureTime = new Date(today.getTime() + 5 * 6000); // Add 5 minutes in milliseconds
    let futureHours = futureTime.getHours();
    let futureMinutes = String(futureTime.getMinutes()).padStart(2, "0");
    let futureFormattedTime = futureHours + ":" + futureMinutes;

    // console.log("Current Time:", currentTime);
    // console.log("Time 5 Minutes Ahead:", futureFormattedTime);

    // Find tournaments where date is today and within the time range
    const tournaments = await TournamentModel.aggregate([
      {
        $match: {
          startDate: date,
          status: "pending",
          // time: {
          //     $gte: currentTime,
          //     $lte: futureFormattedTime
          // }
        },
      },
    ]);

    // console.log("Found Tournaments:", tournaments);
    if (tournaments) {
      res.status(200).json({
        success: true,
        data: tournaments,
      });
    }
  } catch (error) {
    console.error("Server Error:", error);
  }
};

const startTournament = async (req, res) => {  
  console.log(
    "+++++++++++++++++++++++++qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq+++++++++++++++++++++"
  );
  const { tournamentId, gameTime, roundNumber,noOfRounds } = req.params;
  console.log(req.params, tournamentId, gameTime,noOfRounds, roundNumber,"+++++++++dadadaddadaddadaaaaaaaaaaaaaaaaaaaaaaa++++++++++++++");
  // const gameTime=req.body
  try {
    const tournament = await TournamentModel.findById(tournamentId).populate(
      "players"
    );
    if (!tournament)
      return res.status(404).json({ message: "Tournament not found" });
      // -----------------------------old code ----------------


    // -----------------new code is start from here----------------

    if (roundNumber == 1) {
      console.log("==11===========11111111111111=====================")
      if (tournament.status == "pending") {
        // Check if there are enough players
        if (tournament.JoinedPlayerList.length < 2) {
          return res
            .status(400)
            .json({ message: "Not enough players to start the tournament" });
        }
      
        // Create or fetch Player documents and add them to the players array
        const playerIds = [];
        for (const joinedPlayer of tournament.JoinedPlayerList) {
          let player = await PlayersTournament.findOne({
            user: joinedPlayer.user,
            tournamentId: tournament._id,
          });

          if (!player) {
            player = new PlayersTournament({
              user: joinedPlayer.user,
              userData: joinedPlayer.userData,
              tournamentId: tournament._id,
            });
            await player.save();
          }
          playerIds.push(player._id);
        }

        // Update the tournament document with the player IDs
        tournament.upComingRound=tournament.upComingRound+1
        tournament.players = playerIds;
        tournament.status = "ongoing";
        await tournament.save();

        const roundDuration = gameTime*1000; // 10 minutes in milliseconds
        // const breakDuration = 1 * 60 * 1000; // 1 minute in milliseconds

        const noOfPlayers = tournament.noOfplayers;
        //  gameTime = 150||;

        // Generate unique URLs
        const urls = createUniqueUrls(noOfPlayers, gameTime);

        const scheduleNextRound = async () => {
          
          if (tournament.status === "completed") return;
          console.log("+++++++++++++++sheduleeeeeeeeeeee+++++++++++++++++++++");
          const round = await Round.create({ roundNumber });
          await pairPlayersForRound(tournament, round, urls,tournamentId);

          const pendingMatches = await Match.aggregate([
            {
              $match: {
                result: "pending",
                round: round._id,
              },
            },
          ]);

          // console.log(pendingMatches, "Pending matches");

          for (const match of pendingMatches) {
            const player1 = match.player1;
            const player2 = match.player2;

            const pleyer1userId = await PlayersTournament.findOne(player1);
            // console.log(pleyer1userId, "+++++++++ffffffffff++++++++++");
            let player1Id = pleyer1userId.user;
            const pleyer2userId = await PlayersTournament.findOne(player2);
            let player2Id = pleyer2userId.user;

            // console.log(player2Id, player1Id, "uuuuuuuuuuuuuuuuuuuuuuuuuuuuuu");

            const playerMatch = new PairedMatch({
              tournamentId: tournament._id,
              roundId: round._id,
              player1: player1Id,
              player2: player2Id,
              matchUrl: match.url,
            });
            await playerMatch.save();
            // console.log(playerMatch, "gggggggggggg");
          }
          tournament.rounds.push(round);

          await tournament.save();

          for (let i = 0; i < 60; i++) {
            console.log(i);
            await sleep(1000);
          }

          // Simulate results submission for this round after the duration
          setTimeout(async () => {
            console.log("++++++++hiiiiiiiiiiiiiiiiiinhi hogaaaaaaaaaaaaaaa++++++++++");
            await simulateRoundResults(round._id,tournamentId);
            await calculateTournamentScores(tournament);
            // await calculateSonnebornBerger(tournament);
            if (roundNumber == noOfRounds) {
              tournament.status = "completed";
              await tournament.save();
              console.log("Tournament completed");
            }

         
          }, roundDuration);
        };

        scheduleNextRound(); // Start the first round

        res
          .status(200)
          .json({ message: "Tournament started successfully", tournament });
      }
    }
    if (roundNumber > 1) {
      if (tournament.status == "ongoing") {
        console.log("++ghussss gayaaaaaaaaaaaaaa>111111111111111111+++++++++")
        // Check if there are enough players
        if (tournament.JoinedPlayerList.length < 2) {
          return res
            .status(400)
            .json({ message: "Not enough players to start the tournament" });
        }

        // if (roundNumber == noOfRounds) {
        //   console.log("+++++++completedddddd+++++++++")
        //   tournament.status = "completed";
        //   await tournament.save();
        //   console.log("Tournament completed");
        //   res.status(400).json({
        //     success:false,
        //     result:"tournament get completed"
        //   })
        // }

        // Create or fetch Player documents and add them to the players array
        const playerIds = [];
        for (const joinedPlayer of tournament.JoinedPlayerList) {
          let player = await PlayersTournament.findOne({
            user: joinedPlayer.user,
            tournamentId: tournament._id,
          });

          if (!player) {
            player = new PlayersTournament({
              user: joinedPlayer.user,
              userData: joinedPlayer.userData,
              tournamentId: tournament._id,
            });
            await player.save();
          }
          playerIds.push(player._id);
        }

        // Update the tournament document with the player IDs
        tournament.players = playerIds;
        // tournament.status = "ongoing";
        await tournament.save();

        const roundDuration = gameTime*1000; // 10 minutes in milliseconds
        console.log(roundDuration,"kkkkkkkkkkkkk")
        // const breakDuration = 1 * 60 * 1000; // 1 minute in milliseconds

        const noOfPlayers = tournament.noOfplayers;
        //  gameTime = 150||;

        // Generate unique URLs
        const urls = createUniqueUrls(noOfPlayers, gameTime);

        const scheduleNextRound = async () => {
          
          if (tournament.status === "completed") return;
          console.log("+++++++++++++++sheduleeeeeeeeeeee+++++++++++++++++++++");
          const round = await Round.create({ roundNumber });
          await pairPlayersForRound(tournament, round, urls,tournamentId);

          const pendingMatches = await Match.aggregate([
            {
              $match: {
                result: "pending",
                round: round._id,
              },
            },
          ]);

          console.log(pendingMatches, "Pending matches");

          for (const match of pendingMatches) {
            const player1 = match.player1;
            const player2 = match.player2;

            const pleyer1userId = await PlayersTournament.findOne(player1);
            // console.log(pleyer1userId, "+++++++++ffffffffff++++++++++");
            let player1Id = pleyer1userId.user;
            const pleyer2userId = await PlayersTournament.findOne(player2);
            let player2Id = pleyer2userId.user;

            // console.log(player2Id, player1Id, "uuuuuuuuuuuuuuuuuuuuuuuuuuuuuu");

            const playerMatch = new PairedMatch({
              tournamentId: tournament._id,
              roundId: round._id,
              player1: player1Id,
              player2: player2Id,
              matchUrl: match.url,
            });
            await playerMatch.save();
            // console.log(playerMatch, "gggggggggggg");
          }
          tournament.rounds.push(round);
          tournament.upComingRound=tournament.upComingRound+1
          await tournament.save();

          // for (let i = 0; i < 60; i++) {
          //   // console.log(i);
          //   await sleep(1000);
          // }

          // Simulate results submission for this round after the duration
          setTimeout(async () => {
            console.log("++++++++hiiiiiiiiiiiiiiiiiihogaaaaaaaaaaaaaaaa++++++++++");
            await simulateRoundResults(round._id);
            await calculateTournamentScores(tournament);
            // await calculateSonnebornBerger(tournament);
            if (roundNumber == noOfRounds) {
              console.log("+++++++completedddddd+++++++++")
              tournament.status = "completed";
              await tournament.save();
              console.log("Tournament completed");
            }
           
           
          }, roundDuration);
        };

        scheduleNextRound(); // Start the first round

        res
          .status(200)
          .json({ message: "Tournament started successfully", tournament });
      }
      if(tournament.status=="completed"){
        res.status(200).json({message:"Tournament already completed",tournament});
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

const getUpcomingTournament = async (req, res) => {
  try {
    const userId = req.user._id;
   
    // Get the current date and time
    // Get the current time in IST
    const currentTime = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
    const istTime = new Date(currentTime.getTime() + istOffset);

    // Format the current date as YYYY-MM-DD (e.g., "2024-08-26")
    const currentDate = istTime.toISOString().slice(0, 10);

    // Format the current time as HH:MM (e.g., "15:32")
    const currentFormattedTime = istTime.toTimeString().slice(0, 5);

    // console.log(currentFormattedTime, currentDate);

    const tournamentData = await TournamentModel.aggregate([
      {
        $match: {
          "JoinedPlayerList.user": new mongoose.Types.ObjectId(userId), // Use `new` keyword here
          status: "ongoing",
          startDate: currentDate, // Match the current date (e.g., "2024-08-26")
          time: currentFormattedTime, // Match the time exactly one minute from now (e.g., "15:32")
        },
      },
      {
        $sort: { time: 1 }, // Sort by the time to get the most upcoming tournaments first
      },
    ]);
    if (!tournamentData) {
      res.status(404).json({ message: "No upcoming tournaments found" });
    }
    console.log(tournamentData, "ppppppppp");

    const pairedMatches = await Match.find({
      $and: [
        {
          $or: [{ user1: userId }, { user2: userId }],
        },
        { result: 'pending' }
      ]
    });
    console.log(pairedMatches,"++++++ddddddddddddddddddddddddddddddddddddddddd+++++++++")
    
  
    
  
    
    if (!pairedMatches) {
      res.status(404).json({ message: "No paird match found" });
    }



    res.status(200).json({
      tournaments: tournamentData,
      pairedMatches: pairedMatches,
    });
  } catch (error) {
    console.error("Error fetching upcoming tournaments:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getpairPlayers = async (req, res) => {
  const tournamentId = req.params.id;
  console.log(tournamentId);
  try {
    const tournament = await PairedMatch.findOne({
      tournamentId: tournamentId,
    });
    console.log(tournament);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }
    const player1 = await User.findById(tournament.player1).select("-password");
    const player2 = await User.findById(tournament.player2).select("-password");
    res.status(200).json({
      success: true,
      data: {
        tournament,
        player1,
        player2,
      },
    });
  } catch (error) {
    console.error("Error fetching players:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the players",
      error: error.message,
    });
  }
};

const getOngoingmatch = async (req, res) => {
  try {
    const tournament = await TournamentModel.find({
      status: "ongoing",
    });
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }
    res.status(200).json({
      success: true,
      data: tournament,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the tournament",
      error: error.message,
    });
  }
};

const getOngoingmatchData = async (req, res) => {
  try {
    const {round} = req.params.id;
    // const [round1,round2,round3]=req.body
    console.log(round,"uuuuuuuuuuuuuu");
    // Use findOne to search by a field other than the _id
    const matchesData = await Match.aggregate([
      { $match: { round:new mongoose.Types.ObjectId(round), result: "completed" } }
  ]);
 console.log(matchesData,"uyyyyyyyyyyy")
    
    if (!matchesData) {
      return res.status(404).json({
        success: false,
        message: "Round not found",
      });
    }
    let playersScore=[]
    
    for(let element of  matchesData){
    
      let userId1=element.user1
      let userId2=element.user2
      console.log(userId1.toString(),userId2.toString())
      let user1 = await PlayersTournament.findOne({ user: userId1.toString() }); // Convert ObjectId to string if necessary
            let user2 = await PlayersTournament.findOne({ user: userId2.toString() });
      console.log(user1,user2)
      playersScore.push(user1,user2)
 
    }

    if(matchesData){
      res.status(200).json({
        success: true,
        data: playersScore,
        matchesData:matchesData

      })
    }

     
   
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the round data",
      error: error.message,
    });
  }
};

const getTournamentResult = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    // Aggregate players data, matching by tournamentId and sorting by score in descending order
    const playersData = await PlayersTournament.aggregate([
      {
        $match: {
          tournamentId: new mongoose.Types.ObjectId(tournamentId)
        }
      },
      {
        $sort: { score: -1 } // Sorting by score in descending order
      }
    ]);

    // Check if any data was found
    if (!playersData || playersData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No results found"
      });
    }

    // Respond with the sorted players data
    res.status(200).json({
      success: true,
      data: playersData
    });
  } catch (error) {
    // Handle any errors that occur during the aggregation
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};


const getOngoingMatchDatas = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const rounds = req.body.body; // Destructuring the rounds from the request body

    // Initialize an array to store all players' scores
    let playersScore = [];

    // Loop through each round to get the matches and corresponding players' scores
    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i];
      console.log(round, "Processing round data...");

      // Aggregate matches data for the specific round and tournamentId
      const matchesData = await Match.aggregate([
        {
          $match: {
            round: new mongoose.Types.ObjectId(round),
            tournamentId: new mongoose.Types.ObjectId(tournamentId),
            result: "completed"
          }
        }
      ]);

      console.log(matchesData, "Matches data for round:", round);

      // If no matches found for the round, skip to the next round
      if (!matchesData || matchesData.length === 0) {
        continue;
      }

      // Fetch players' data for each match and add it to the playersScore array
      for (let match of matchesData) {
        const user1 = await PlayersTournament.findOne({ user: match.user1.toString() });
        const user2 = await PlayersTournament.findOne({ user: match.user2.toString() });
        console.log(user1, user2);

        if (user1) {
          playersScore.push({
            ...user1.toObject(), // Spread the user's data
            roundNumber: i + 1   // Add the round number
          });
        }

        if (user2) {
          playersScore.push({
            ...user2.toObject(), // Spread the user's data
            roundNumber: i + 1   // Add the round number
          });
        }
      }
    }

    // Check if any players' scores were found
    if (playersScore.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No completed matches found for the given rounds and tournament.",
      });
    }

    // Respond with the collected players' scores and matches data
    res.status(200).json({
      success: true,
      data: playersScore,
    });

  } catch (error) {
    // Handle any errors that occur during the process
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the match data",
      error: error.message,
    });
  }
};








// cron.schedule("* * * * *", async () => {
//     try {
//         let today = new Date();

//         // Format the date to 'YYYY-MM-DD'
//         let year = today.getFullYear();
//         let month = String(today.getMonth() + 1).padStart(2, '0'); // Ensure two digits for the month
//         let day = String(today.getDate()).padStart(2, '0'); // Ensure two digits for the day

//         let date = `${year}-${month}-${day}`;
//         console.log(date, "kkkkk");

//         // Get the current time
//         let currentTime = today.getHours() + ":" + String(today.getMinutes()).padStart(2, '0');

//         // Calculate the time 5 minutes ahead
//         let futureTime = new Date(today.getTime() + 5 * 6000); // Add 5 minutes in milliseconds
//         let futureHours = futureTime.getHours();
//         let futureMinutes = String(futureTime.getMinutes()).padStart(2, '0');
//         let futureFormattedTime = futureHours + ":" + futureMinutes;

//         console.log("Current Time:", currentTime);
//         console.log("Time 5 Minutes Ahead:", futureFormattedTime);

//         // Find tournaments where date is today and within the time range
//         const tournaments = await TournamentModel.aggregate([
//             {
//                 $match: {
//                     startDate: date,
//                     // time: {
//                     //     $gte: currentTime,
//                     //     $lte: futureFormattedTime
//                     // }
//                 }
//             }
//         ]);

//         console.log("Found Tournaments:", tournaments);
//         if(tournaments){

//         }
//     } catch (error) {
//         console.error('Server Error:', error);
//     }
// });

module.exports = {
  createTournament,
  updateTournament,
  deleteTournament,
  getMyTournament,
  joinTournament,
  getTournamentByUserId,
  getTournamentById,
  adminNotification,
  startTournament,
  getUpcomingTournament,
  getpairPlayers,
  getOngoingmatch,
  getOngoingmatchData,
  getTournamentResult,
  getOngoingMatchDatas
};

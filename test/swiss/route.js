const express = require("express");
const router = express.Router();
const { createMatch, updateMatchResult } = require("../controllers/matchController");
const { addPlayer } = require("../controllers/playerController");
const { createRound, completeRound } = require("../controllers/roundController");

// Player routes
router.post("/player", addPlayer);

// Match routes
router.post("/match", createMatch);
router.put("/match/:id", updateMatchResult);      //2

// Round routes
router.post("/round", createRound);      //1   
router.put("/round/:id/complete", completeRound);   //3

module.exports = router;


  
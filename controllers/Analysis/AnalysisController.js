const Analysis = require("../../models/Analysis");

const getAnalysisByUserId = async (req, res) => { 
    try {
        const { playerId } = req.params;
        console.log("Player ID:", playerId);

        const allData = await Analysis.aggregate([
            { $match: { "analysisData.players.playerId": playerId } },
            { $unwind: "$analysisData" },
            { $match: { "analysisData.players.playerId": playerId } },
            { $group: { _id: "$_id", analysisData: { $push: "$analysisData" } } }
        ]);

        console.log("Filtered Data:", allData);

        res.status(200).json({
            success: true,
            data: allData
        });
    } catch (error) {
        console.error("Error fetching analysis data:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching analysis data."
        });
    }
};

module.exports = {
    getAnalysisByUserId,
};

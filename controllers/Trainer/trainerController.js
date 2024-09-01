const Trainer = require("../../models/trainerModel");

const { check, validationResult } = require("express-validator");

const CreateTrainer = async (req, res) => {
    try {
        const { name, age, content, experience, address, language, feesPerHour } = req.body;
        
        if (!req.file || !req.file.filename) {
            return res.status(400).json({ error: 'Image file is required' });
        }

        const image = req.file.filename;
        console.log(`Uploaded image: ${image}`);
        console.log(`Uploaded data: ${name,age,address,content,experience,language,feesPerHour}`);

        const newTrainer = new Trainer({
            name,
            age,
            content,
            experience,
            image,
            address,
            language,
            feesPerHour
        });

        await newTrainer.save();
        res.status(200).json({ success: true, data: newTrainer });
    } catch (error) {
        console.error('Error creating trainer:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


const getTrainer = async (req, res) => {
    try {
        const { trainerId } = req.params;
        const baseUrl = `${req.protocol}://${req.get("host")}/public/trainerImages/`;
        
        if (trainerId === "get-all") {
            const trainerData = await Trainer.find();

            // Append the image URL to each trainer
            trainerData.forEach(trainer => {
                trainer.image = baseUrl + trainer.image;
            });

            if (!trainerData.length) {
                return res.status(400).json({
                    message: 'No trainers found'
                });
            }

            res.status(200).json({
                trainerData
            });
        } else {
            const trainerData = await Trainer.findById(trainerId);

            if (!trainerData) {
                return res.status(400).json({
                    message: 'Trainer not found'
                });
            }

            // Append the image URL to the single trainer
            trainerData.image = baseUrl + trainerData.image;

            res.status(200).json({
                trainerData
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Server error'
        });
    }
};

const deleteTrainer = async (req, res) => {
    try {
        const { trainerId } = req.params
        console.log(trainerId)
        const trainerData = await Trainer.findById(trainerId)
        if (!trainerData) {
            return res.status(400).json({
                message: 'Trainer not found'
            })
        }
        await Trainer.findByIdAndDelete(trainerId)
        res.status(200).json({
            message: 'Trainer deleted'
        })
    } catch (error) {
        res.status(500).json({
            message: 'Server error'
        })
    }
}

const editTrainer = async (req, res) => {
    try {
        const { trainerId } = req.params
        const trainerData = req.body
        const updatedTrainerData = await Trainer.findByIdAndUpdate(trainerId, trainerData, {
            new: true,
            runValidators: true
        })
        res.staus(200).json({
            data: updatedTrainerData,
            message: 'Trainer updated'
        })
    } catch (error) {
        res.status(500).json({
            message: 'Server error'
        })
    }
}




module.exports = {
    CreateTrainer,
    getTrainer,
    deleteTrainer,
    editTrainer
};

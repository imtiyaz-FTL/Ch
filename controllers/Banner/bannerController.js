
const Banner = require("../../models/BannerModel")
const { check, validationResult } = require("express-validator");

const getBanner = async (req, res) => {
  try {
    const { title } = req.params; // Destructure title from req.params
    console.log(title, "ffffff");
  
    if (title === "getAll") {
      const allBanner = await Banner.find({});
      if (allBanner.length > 0) {
        const allBannerWithImageUrl = allBanner.map(banner => ({
          ...banner.toObject(),
          images: banner.images.map(image => `${req.protocol}://${req.get("host")}/public/bannerImages/${image}`)
        }));
        res.status(200).json({
          success: true,
          data: allBannerWithImageUrl
        });
      } else {
        res.status(400).json({
          success: false,
          message: "No content found"
        });
      }
    } else {
      const content = await Banner.find({ title });
      const baseUrl = `${req.protocol}://${req.get("host")}/public/bannerImages/`;
      console.log("Fetched content:", content);
  
      if (content.length > 0) {
        const bannersWithUrls = content.map(banner => ({
          ...banner.toObject(),
          images: banner.images.map(image => `${baseUrl}${image}`)
        }));
        res.status(200).json({
          success: true,
          data: bannersWithUrls
        });
      } else {
        res.status(400).json({
          success: false,
          message: "No content found"
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

const createBanner = async (req,role, res) => {
  try {
    const { title } = req.body;
    const imageFiles = req.files; // Multiple files
    if (!imageFiles || imageFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images were uploaded.",
      });
    }
    const imageUrls = imageFiles.map(file =>`${file.filename}`);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }
    const newContent = new Banner({ title, images: imageUrls });
    await newContent.save();
    res.status(200).json({
      success: true,
      message: "Content created successfully",
      data: newContent,
    });
  } catch (error) {
    console.error('Error:', error); // Log the error for debugging
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const deleteBanner=async(req,role,res)=>{
 try {
  
   const { id } = req.params; // Correctly destructure id from req.params
   console.log(id);
   const deleteRule = await Banner.findByIdAndDelete(id);
    
   if (!deleteRule) {
     return res.status(404).json({
       success: false,
       message: "No content found"
     });
   }
   
   res.status(200).json({
     success: true,
     message: "Content deleted successfully"
   });

 } catch (error) {
  
   res.status(500).json({
     success: false,
     message: "Server error",
     error: error.message
   });
 }
}

// const deleteRuleContent = async (req,role, res) => {
//   try {
//     const errors = validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         message: "Validation error",
//         errors: errors.array(),
//       });
//     }
//     // console.log("hiiiiiiiiiii");
//     const { id } = req.params; // Correctly destructure id from req.params
//     console.log(id);

//     // Assuming id is a unique identifier such as _id in MongoDB
//     const deleteRule = await Content.findByIdAndDelete(id);
    
//     if (!deleteRule) {
//       return res.status(404).json({
//         success: false,
//         message: "No content found"
//       });
//     }
    
//     res.status(200).json({
//       success: true,
//       message: "Content deleted successfully"
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// const editRuleContent = async (req, res) => {
//   try {
//     const { id } = req.params; // Destructure id from req.params
//     const updateData = req.body; // The new data to update the content with
//     console.log(`Updating content with id: ${id}`);
//     console.log('Update data:', updateData);
//     // Find the content by id and update it with the new data
//     const updatedContent = await Content.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
//     if (!updatedContent) {
//       return res.status(404).json({
//         success: false,
//         message: "No content found"
//       });
//     }
//     res.status(200).json({
//       success: true,
//       message: "Content updated successfully",
//       data: updatedContent
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };





module.exports = {
   getBanner,
  createBanner,
  deleteBanner
}

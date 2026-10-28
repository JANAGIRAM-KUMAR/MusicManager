import User from "../models/User.js";

const getAllUsers = async (req, res, next) => {
    try{
      const currentUserId = req.userId;
      // Project only non-sensitive public profile fields, avoiding PII leakage
      const users = await User.find({_id: {$ne: currentUserId}}).select("_id fullName imageUrl");
      res.status(200).json(users);
    }
    catch(error){
       console.log("Error in getting all users", error);
       next(error);
    }
}

export {getAllUsers};
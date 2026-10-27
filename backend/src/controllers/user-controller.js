import User from "../models/User.js";

const getAllUsers = async (req, res, next) => {
    try{

      const currentUserId = req.userId;
      const users = await User.find({_id: {$ne: currentUserId}}); // getting all users except the current user
      res.status(200).json(users);
    }
    catch(error){
       console.log("Error in getting all users", error);
       next(error);
    }
}

export {getAllUsers};
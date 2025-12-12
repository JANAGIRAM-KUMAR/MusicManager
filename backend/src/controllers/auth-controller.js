import User from "../models/User.js";

const authCallback = async (req, res) => {
   try {
        const {id, fullName, lastName, imageUrl} = req.body;

        //check if user exists 
        const user = await User.findOne({clerkId: id});
        if(!user){
            const createUser = new User({
                clerkId: id,
                fullname: `${fullName} ${lastName}`,
                imageUrl
            });
            await createUser.save();
            res.status(201).json({success: true, message: 'User created successfully', user: createUser});
        }


   } catch (error) {
       console.error('Error in auth callback route:', error);
       res.status(500).json({success: false, message: 'Internal server error'});
   }
};

export {authCallback};
import { clerkClient } from "@clerk/express";

const protectRoute = async (req, res, next) => {
    if(req.auth.userId === undefined){
        return res.status(401).json({success: false, message: 'Unauthorized -> You are not logged in'});
    }
    next();
}

const isAdminUser = async (req, res, next) => {
    try{
        const user = await clerkClient.users.getUser(req.auth.userId);
        const isAdmin = process.env.ADMIN_EMAIL === user.primaryEmailAddress.emailAddress;
        if(!isAdmin){
            return res.status(403).json({success: false, message: 'Forbidden -> You are not an admin'});
        }
        next(); 
    }
    catch(error){
        console.error("Error in admin check middleware:", err);
        next(error);
    }
}

export {protectRoute, isAdminUser};
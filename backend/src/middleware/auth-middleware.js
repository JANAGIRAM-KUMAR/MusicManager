import { clerkClient } from "@clerk/express";

const protectRoute = (req, res, next) => {
  const auth = req.auth(); 

  // optional debug (remove later)
  // console.log("AUTH:", auth);

  if (!auth?.userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized -> You are not logged in",
    });
  }

  req.userId = auth.userId;
  next();
};

const isAdminUser = async (req, res, next) => {
  try {
    const auth = req.auth(); 

    if (!auth?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await clerkClient.users.getUser(auth.userId);

    const isAdmin =
      user.primaryEmailAddress?.emailAddress === process.env.ADMIN_EMAIL;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden -> You are not an admin",
      });
    }

    next();
  } catch (error) {
    console.error("Error in admin check middleware:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export { protectRoute, isAdminUser };

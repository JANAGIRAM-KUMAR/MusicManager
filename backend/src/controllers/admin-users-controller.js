import User from "../models/User.js";
import Playlist from "../models/Playlist.js";
import Like from "../models/Like.js";
import PlayHistory from "../models/PlayHistory.js";

const adminEmails = () =>
  (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(/[\s,]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export const getAllUsersAdmin = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    const admins = adminEmails();

    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const uId = u._id.toString();
        const [playlistCount, likesCount, playsCount] = await Promise.all([
          Playlist.countDocuments({ ownerId: uId }),
          Like.countDocuments({ userId: uId }),
          PlayHistory.countDocuments({ userId: uId }),
        ]);

        const isAdmin = admins.includes(u.email?.toLowerCase());

        return {
          _id: uId,
          googleId: u.googleId,
          email: u.email,
          fullName: u.fullName,
          imageUrl: u.imageUrl,
          authProvider: u.authProvider || "local",
          createdAt: u.createdAt,
          isAdmin,
          playlistCount,
          likesCount,
          playsCount,
        };
      })
    );

    res.status(200).json({ success: true, users: enrichedUsers });
  } catch (error) {
    console.error("Error in getting all users:", error);
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.userId) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account" });
    }
    await User.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("Error in deleting user:", error);
    next(error);
  }
};

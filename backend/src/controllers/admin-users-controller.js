import User from "../models/User.js";

export const getAllUsersAdmin = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
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

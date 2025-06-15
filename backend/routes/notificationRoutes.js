const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const NotificationService = require("../services/notificationService");

// Get user notifications
router.get("/", protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await NotificationService.getUserNotifications(
      req.user._id,
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// Get unread count
router.get("/unread-count", protect, async (req, res) => {
  try {
    const Notification = require("../models/Notification");
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
});

// Mark notification as read
router.patch("/:id/read", protect, async (req, res) => {
  try {
    await NotificationService.markAsRead(req.params.id, req.user._id);
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
router.patch("/mark-all-read", protect, async (req, res) => {
  try {
    await NotificationService.markAllAsRead(req.user._id);
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res
      .status(500)
      .json({ message: "Failed to mark all notifications as read" });
  }
});

// Delete notification
router.delete("/:id", protect, async (req, res) => {
  try {
    await NotificationService.deleteNotification(req.params.id, req.user._id);
    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

module.exports = router;

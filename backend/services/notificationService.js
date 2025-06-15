const Notification = require("../models/Notification");
const {
  sendNotificationToUser,
  sendNotificationToAdmins,
  sendCommentNotification,
  sendLikeNotification,
} = require("../socket/socketHandler");

class NotificationService {
  // Create and send a notification
  static async createNotification({
    recipient,
    sender = null,
    type,
    title,
    message,
    relatedPost = null,
    relatedComment = null,
    metadata = {},
  }) {
    try {
      const notification = new Notification({
        recipient,
        sender,
        type,
        title,
        message,
        relatedPost,
        relatedComment,
        metadata,
      });

      await notification.save();

      // Populate sender and related data for real-time emission
      await notification.populate([
        { path: "sender", select: "name profileImageUrl" },
        { path: "relatedPost", select: "title slug" },
        { path: "relatedComment", select: "content" },
      ]);

      // Send real-time notification
      sendNotificationToUser(recipient, {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        sender: notification.sender,
        relatedPost: notification.relatedPost,
        relatedComment: notification.relatedComment,
        metadata: notification.metadata,
        createdAt: notification.createdAt,
        isRead: false,
      });

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  // Send comment notification
  static async notifyNewComment({
    postAuthorId,
    commenterName,
    commenterId,
    postTitle,
    postId,
    commentId,
    postSlug,
  }) {
    if (postAuthorId.toString() === commenterId.toString()) {
      return; // Don't notify if author comments on their own post
    }

    await this.createNotification({
      recipient: postAuthorId,
      sender: commenterId,
      type: "comment",
      title: "New Comment on Your Post",
      message: `${commenterName} commented on your post "${postTitle}"`,
      relatedPost: postId,
      relatedComment: commentId,
      metadata: { postSlug },
    });

    // Also send to post room for real-time updates
    sendCommentNotification(postId, {
      type: "new_comment",
      commenterName,
      postTitle,
      postId,
      commentId,
    });
  }

  // Send like notification
  static async notifyPostLike({
    postAuthorId,
    likerName,
    likerId,
    postTitle,
    postId,
    postSlug,
  }) {
    if (postAuthorId.toString() === likerId.toString()) {
      return; // Don't notify if author likes their own post
    }

    await this.createNotification({
      recipient: postAuthorId,
      sender: likerId,
      type: "like",
      title: "Someone Liked Your Post",
      message: `${likerName} liked your post "${postTitle}"`,
      relatedPost: postId,
      metadata: { postSlug },
    });
  }

  // Send admin action notification
  static async notifyAdminAction({
    userId,
    adminName,
    adminId,
    action,
    details,
  }) {
    await this.createNotification({
      recipient: userId,
      sender: adminId,
      type: "admin_action",
      title: "Admin Action",
      message: `${adminName} ${action}. ${details}`,
      metadata: { action, details },
    });
  }

  // Send system notification
  static async notifySystem({ userId, title, message, metadata = {} }) {
    await this.createNotification({
      recipient: userId,
      type: "system",
      title,
      message,
      metadata,
    });
  }

  // Send notification to all admins
  static async notifyAdmins({ title, message, metadata = {} }) {
    const User = require("../models/User");
    const admins = await User.find({ role: "Admin" }).select("_id");

    const notifications = admins.map((admin) => ({
      recipient: admin._id,
      type: "system",
      title,
      message,
      metadata,
    }));

    await Notification.insertMany(notifications);

    // Send real-time notification to admin room
    sendNotificationToAdmins({
      type: "system",
      title,
      message,
      metadata,
      createdAt: new Date(),
    });
  }

  // Get user notifications
  static async getUserNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "name profileImageUrl")
      .populate("relatedPost", "title slug")
      .populate("relatedComment", "content")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ recipient: userId });
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return {
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalNotifications: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
      unreadCount,
    };
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true }
    );
  }

  // Mark all notifications as read
  static async markAllAsRead(userId) {
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );
  }

  // Delete notification
  static async deleteNotification(notificationId, userId) {
    await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });
  }
}

module.exports = NotificationService;

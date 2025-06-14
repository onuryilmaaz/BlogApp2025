const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImageUrl: { type: String, default: null },
    bio: { type: String, default: "" },
    role: { type: String, enum: ["Admin", "Member"], default: "Member" },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
// Note: email already has unique index from schema definition
UserSchema.index({ role: 1 }); // For role-based queries
UserSchema.index({ createdAt: -1 }); // For user registration order

module.exports = mongoose.model("User", UserSchema);

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        googleId: { type: String, required: true, unique: true },
        nombre: { type: String, required: true },
        correo: { type: String, required: true, unique: true },
        avatar: { type: String },
    },
    { timestamps: true },
);

module.exports = mongoose.model('User', UserSchema);

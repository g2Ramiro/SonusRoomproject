const mongoose = require('mongoose');

const PlaylistSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String },
    creador: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    canciones: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }]
}, { timestamps: true });

module.exports = mongoose.model('Playlist', PlaylistSchema);
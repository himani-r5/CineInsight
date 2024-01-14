const mongoose = require('mongoose');

const dbUrl = 'mongodb://localhost:27017/CineInsightRegistration';

mongoose.connect(dbUrl);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Movie Schema
const movieSchema = new mongoose.Schema({
  title: String,
  rating: String,
  summary: String,
  runtime: String,
  language: String,
  genres: String,
  completeUrl: String,
  posterUrl: String,
  trailerUrl: String,
  platforms: [String],
  
});

const Movie = mongoose.model('Movie', movieSchema);

module.exports = { mongoose, Movie };

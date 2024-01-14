const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/CineInsightRegistration");

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB");
});



const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
});



const movieSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
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
  
  const User = mongoose.model("User", userSchema);
  const Movie = mongoose.model("Movie", movieSchema);
  
  module.exports = { User, Movie };


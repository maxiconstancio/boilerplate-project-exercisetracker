const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
var bodyParser = require("body-parser");
require("dotenv").config({ path: "db.env" });
//BD Configuration
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const Schema = mongoose.Schema;
//Collection Users
const userSchema = new Schema({
  userName: { type: String, required: true },
});
//Collection Exercises
const exerciseSchema = new Schema({
  user: { type: Schema.ObjectId, ref: "userSchema" },
  description: { type: String, required: true },
  duration: Number,
  date: Date,
});
let userModel = mongoose.model("userDb", userSchema);
let exerciseModel = mongoose.model("exercise", exerciseSchema);

//Basic Configuration
app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// View
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Create User
app.post("/api/users", function (req, res) {
  let string = req.body.username;
  if (string === "") {
    res.json({ error: "field username is required" });
  }
  let newUser = new userModel({ userName: string });
  newUser.save(function (err, data) {
    if (err) return console.log(err);
    res.json({ userName: string, _id: data.id });
  });
  //res.json({ userName: string, "_id":  });
});

// New Exercise
app.post("/api/users/:_id/exercises", function (req, res) {
  let userId = req.params["_id"];
  let exerUser;
  if (userId === "") {
    req.json({ error: "field username is required" });
  }
  userModel.findOne({ _id: userId }, function (err, data) {
    if (err) return res.json(err.message);
    if (data == null) return res.json ('user no exist')
      exerUser = data.id;
      let exerUserName = data.userName;
      let dateExercise  = new Date (req.body.date).toDateString();
      console.log(dateExercise)
      let exercises = new exerciseModel({
        user: exerUser,
        description: req.body.description,
        duration: req.body.duration,
        date: dateExercise,
      });
      exercises.save(function (err, data) {
        if (err) return console.log(err);
        res.json({ "_id": exerUser, "username": exerUserName, "date": dateExercise, "duration": data.duration, "description": data.description  });
      });
    
  });
});

app.get("/api/users", function (req, res) {
  userModel.find({}, function (err, data) {
    if (err) return console.log(err);
    res.json(data);
  });
});

app.get ("/api/users/:_id/logs?[from][&to][&limit]", function (req, res) {
  res.json ({"que va": "los logs"})
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

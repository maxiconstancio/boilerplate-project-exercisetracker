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
  username: { type: String, required: true },
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
const rgx = {
  duration: /^\d+$/,
  date: /^\d{4}-\d{1,2}-\d{1,2}$/
}

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
  let newUser = new userModel({ username: string });
  newUser.save(function (err, data) {
    if (err) return console.log(err);
    res.json({ username: string, _id: data.id });
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
      let exerUserName = data.username;
      if (new Date (req.body.date).toDateString()) {
      let dateExercise  = req.body.date != undefined ? new Date (req.body.date).toDateString() : new Date().toDateString();
      //console.log(dateExercise) 
      if (dateExercise == "Invalid Date") {
        console.log(req.body.date)
        return res.json ("Invalid Date")
      }
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
    
  }else {
    return ({"error": "invalid date}"})
  }});
}); 

app.get("/api/users", function (req, res) {
  userModel.find({}, function (err, data) {
    if (err) return console.log(err);
    res.json(data);
  });
});

//Retrieve a full exercise log of any user

app.get('/api/users/:_id/logs',async (req, res) => {
  console.log(req.query)
  console.log(req.params)
  const { to, limit, from } = req.query;
   //if (typeof(from) != Date&&(from != null)) return res.json("Invalid Date")
  
try {
  
  userModel.findById(req.params._id, (async(err, user) => {
    if(!user) return res.json({
      count: 0,
      log:[]
    })
    if(err || !user){
      return res.json({ error: err})
    }
    //console.log (user._id)
    let log = await exerciseModel.find({ user: user._id }).select(['date', 'description', 'duration'])//.limit(+limit);
    log = log.map(({
      description,
      duration,
      date
    }) => {
      return ({
        description,
        duration,
        date: new Date(date).toDateString()
      })
    })
    
    if(rgx.date.test(to)){
      log = log.filter(ex => {
        return Date.parse(ex.date) <= Date.parse(to)
      })
    } 

    if(rgx.date.test(from)){
      log = log.filter(ex => {
        return Date.parse(ex.date) >= Date.parse(from)
      })
    }
    //console.log ("antes" + log.length)
    log = log.slice(0, parseInt(limit) || log.length)
    //console.log("largo del log" + log.length)
    //if (log.length == 0) return res.json("not found")
    const response = {
          _id: user._id,
          username: user.username,
          count:log.length,
          log,
    }
    console.log(response);
        // console.log(response)
    return res.json(response)
    
  }))
} catch(e) {
  console.log('assertion error',e)
}
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

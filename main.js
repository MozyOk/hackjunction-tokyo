const express = require('express');
const app = express();
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const serviceAccount = require('./nodemucu-6970a');

// express setting
const router = express.Router();
app.listen(3000);
app.use('/api', router);
module.exports = app;

// Only Get
router.get('/', function(req, res) {
  try {
    console.log('here is get / !');

    console.log("get state");
    GetSignalState();
    
    res.send('ALL OK 😎');

  }catch (e) {
    console.log(e.message);
    res.status(500).send({error:e.message});
  }
});

// change handling
router.get('/handling', function(req, res) {
  try {
    console.log('here is get /handling !')
    
    const human_data = req.query.human;

    if(!human_data){
      res.send('please human param! ex) http://localhost:3000/api?human=red');
    }
    console.log(`req param : ${human_data}`);

    if (human_data === "red"){
      // stay human
      signalControl(1,0);
    }
    else{
      // Not stay human
      signalControl(0,1);
    }

    res.send('CHANGE OK 😎');

  }catch (e) {
    console.log(e.message);
    res.status(500).send({error:e.message});
  } 
});

router.get('/pir', async function(req, res) {
  try {
    console.log('here is get /pir !')

    // pir_data is 0 or 1
    const pir_data = await GetLatestPirData();

    if (pir_data === 1){
      // staying human
      signalControl(1,0);
    }
    else{
      // Not stay human
      signalControl(0,1);
    }

    res.send('CHANGE OK 😎');

  }catch (e) {
    console.log(e.message);
    res.status(500).send({error:e.message});
  } 
});


// firebase setting
admin.initializeApp( {
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://nodemucu-6970a.firebaseio.com/" //database URL
} );

const db = admin.database();
//looking data
const ref_light_human = db.ref("light_human");
const ref_light_car = db.ref("light_car"); 
const pir_data = db.ref("pir_data");

// signalControl(0,0);

// THIS IS algorithm
// prioritize Human over car
// 0 is false
// human, car => light
// 0, 0 => car green, human red
// 0, 1 => car green, human red
// 1, 0 => car red, human green
// 1, 1 => car red, human green

function signalControl (human, car) {
  if (human == 0){
      if(car == 0){
        // human 0, car 0
        SetHumanLight("red");
        SetCarLight("green");
      }
      else{
        // human 0, car 1
        SetHumanLight("red");
        SetCarLight("green");
      }
    }else{
      if(car == 0){
      // human 1, car 0
        SetHumanLight("green");
        SetCarLight("red"); 
      }
      else{
        // human 1, car 1
        SetHumanLight("green");
        SetCarLight("red");  
      }
    }
}

// this is firebase data
function SetHumanLight(color){
  ref_light_human.set({
    light_car: color
  });
  ref_light_human.once("value", function(snapshot) {
    console.log(`🏃‍♂️ light for human now : ${JSON.stringify(snapshot.val())}`);
  })
}

function SetCarLight(color){
  ref_light_car.set({
    light_car: color
  });
  ref_light_car.once("value", function(snapshot) {
    console.log(`🚗 light for car now : ${JSON.stringify(snapshot.val())}`);
  });
}

function GetSignalState(){
  ref_light_human.once("value", function(snapshot) {
    console.log(`🏃‍♂️ light for human now : ${JSON.stringify(snapshot.val())}`);
  })
  ref_light_car.once("value", function(snapshot) {
    console.log(`🚗 light for car now : ${JSON.stringify(snapshot.val())}`);
  });

}

async function  GetLatestPirData(){
  const data = await pir_data.orderByKey().limitToLast(1).once("value", function(snapshot) {
    console.log(JSON.stringify(snapshot.val()));
  }); 
  // FIX ME here is object!! not a string
  return data;
}

function GetAllPirData(){
  pir_data.once("value", function(snapshot) {
    console.log(JSON.stringify(snapshot.val()));
  });  
}

function SendSMS(){
  // fix here
  const send_text = "";
  unirest.post(`https://nexmo-nexmo-messaging-v1.p.rapidapi.com/send-sms?text=${send_text}&from=815031964922&to=818020194342`)
  .header("X-RapidAPI-Key", "d7f9c9cbcamshfe9bfd821671438p193319jsnc3dd4009638a")
  .header("Content-Type", "application/x-www-form-urlencoded")
  .end(function (result) {
    console.log(result.status, result.headers, result.body);
  });
}
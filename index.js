const express = require('express')
const app = express()
const port = process.env.PORT || 8000 ;
var cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
var jwt = require('jsonwebtoken');


// midle taare
app.use(cors())
app.use(express.json())



// mongo db
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD_KEY}@cluster0.82lu9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



// verrify jwt token function

 function verrifyjwt (req,res,next){
  const tokengetfromclient = req.headers.authorization
  if(!tokengetfromclient){
    return res.status(403).send({massage : "unauthorized access"})
  }
  const token = tokengetfromclient.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET , function(err, decoded){
    if(err){
      return res.status(401).send({message : "forbidden access" })
    }
    // console.log( "decoded", decoded);
    req.decoded = decoded
  })
  next();
 }
// jwr verify done here


async function run(){
    
   try{
     await client.connect();
     const collection = client.db("Doctors").collection("services");
     const bookingappoinments = client.db("pattients").collection("appoinments");
     const userinformation = client.db("user").collection("information");

    //  get service fromm database
     app.get("/services" , async(req,res)=> {
       const query ={}
       const cursor = collection.find(query)
       const result = await cursor.toArray();
       res.send(result)
     } )
    //  prodcuts get end here


    // pattinet appoint booking detilas
    app.post('/appoinments' , async(req,res) => {
      const userappointmnettakingform = req.body;
      // 
      const query ={doctorcategorey: userappointmnettakingform.doctorcategorey,
          appointmentDate: userappointmnettakingform.appointmentDate , appoinmentpattientemail:userappointmnettakingform.appoinmentpattientemail}
      const existsuser = await bookingappoinments.findOne(query)
      if(existsuser){
        return res.send ({success: false, userappointmnettakingform: existsuser })
      }
      const storebokingappoinmentsindatabase = await bookingappoinments.insertOne(userappointmnettakingform)
      res.send({success : true,  storebokingappoinmentsindatabase})
    } )
    // database store appoinments end here


    // slots minus user taking appoinment minus slots from slot tabe/{array}
    app.get('/available' , async( req,res )=> {
      const  appointmentDate = req.query.appointmentDate

      //1st  get all data from coolection mongodb
      const services = await collection.find().toArray()

      // get data date  wise
      const query = {appointmentDate: appointmentDate}    
      const bookingsservice = await bookingappoinments.find(query).toArray()
      // find for service bookings
      services.forEach(service => {
        const servicesbookings = bookingsservice.filter(booking => service.categorey === booking.doctorcategorey)
        const booked = servicesbookings.map(s=> s.appoinmentslot);
        const availableslots = service.slots.filter(a=> !booked.includes(a))
        service.slots = availableslots
      })
      res.send(services)
    } )

       
    // show dashbord in pattiont data
    // for find multiple in database that why we will use find(query) if we will give here findOne() this data will give 0
     app.get('/appoinment', verrifyjwt, async(req,res)=> {
       const appoinmentpattientemail = req.query.appoinmentpattientemail;
      const decoded = req.decoded.email ;
      if(decoded === appoinmentpattientemail ){
        const query = {appoinmentpattientemail:appoinmentpattientemail}
        const findbayName = await bookingappoinments.find(query).toArray()
        return res.send(findbayName)
      }
       else{
        return res.status(403).send({message : "forbidden access"})
       }
     }) 


    //  make admin role
    app.put('/user/admin/:email', verrifyjwt, async(req,res)=> {
      const email = req.params.email;
      console.log(email);
      const filter= {email: email}
      const updateDoc = {
       $set: {role : "admin"}
     }
     const storeuserinformation = await userinformation.updateOne(filter,updateDoc)
     res.send(storeuserinformation)
    })

    
     // user information store in db with jwttoken
     app.put('/user/:email' , async(req,res)=> {
       const email = req.params.email ;
       const user = req.body;
       const filter= {email: email}
       const options = { upsert: true };
       const updateDoc = {
        $set: user
      }
      const storeuserinformation = await userinformation.updateOne(filter,updateDoc, options)
       storeuserinformation.token = jwt.sign({email: email}, process.env.JWT_SECRET, { expiresIn: '1h' })
      res.send(storeuserinformation)
      // as well you can use token = ...
      // and res.send({storeuserinformation , toke})
      // A numeric value is interpreted as a seconds count. If you use a string be sure you provide the time units (days, hours, etc), otherwise milliseconds unit is used by default ("120" is equal to "120ms").
     })

      // get all users from data base that we will create in app.put methods
      app.get('/user',  verrifyjwt, async(req,res)=>{
        const allregisteruser = await userinformation.find().toArray()
        res.send(allregisteruser)
      })



   }

   finally{

   }

}
run().catch(console.dir);



// junk mongo code
// client.connect(err => {
//   const collection = client.db("test").collection("devices");
// //   perform actions on the collection object
// console.log("connected emu jilli ");
//   client.close();
// });




app.get('/', (req, res) => {
  res.send('HWorlkecha he lok acchan na hamare ead kar nad!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
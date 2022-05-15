const express = require('express')
const app = express()
const port = process.env.PORT || 8000 ;
var cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');



// midle taare
app.use(cors())
app.use(express.json())


// mongo db
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD_KEY}@cluster0.82lu9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    
   try{
     await client.connect();
     const collection = client.db("Doctors").collection("services");
     const bookingappoinments = client.db("pattients").collection("appoinments");

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
      console.log(userappointmnettakingform);
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
       
    // show dashbord in pasttiont data
    // for finf multiple in database that why we will use find(query) if we will give here findOne() this data will give 0
     app.get('/appoinment' ,async(req,res)=> {
       const appoinmentpattientemail = req.query.appoinmentpattientemail;
       const query = {appoinmentpattientemail:appoinmentpattientemail}
       const findbayName = await bookingappoinments.find(query).toArray()
       res.send(findbayName)
     } ) 


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
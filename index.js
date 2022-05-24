const express = require('express')
const app = express()
const port = process.env.PORT || 8000 ;
var cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken');
// sreipr requere
const stripe = require("stripe")(process.env.STRIPE_KEY);



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
     const doctorsformation = client.db("Doctorsinfo").collection("Docinfo");
     const paymentinfo = client.db("payment").collection("payments");
    //  cosnt 

  //  verify admin process
    const verifyadmin = async(req,res,next) =>{
      const requester = req.decoded.email;
      const adminsrequester = await userinformation.findOne({email:requester})
      if(adminsrequester.role === 'admin'){
        next()
      }
      else{
        res.status(403).send({message: " forbidden access"})
      }
    }
         
   

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


    //  app.get('/appoinment/:id', async(req,res)=>{
    //    const id = req.params.id;
    //    const query =  {_id : ObjectId(id)}
    //    const idwise = await bookingappoinments.findOne(query)
    //    res.send(idwise)
    //  })
  
    // id wise information collection for payments
    app.get('/appoinment/:id',  async(req,res)=> {
      const id = req.params.id;   
      const query = {_id : ObjectId(id)}
      const idwiseonformation = await bookingappoinments.findOne(query)
      res.send(idwiseonformation)
    })


    // booking appoinments update payment wise payment info store

     app.patch('/appoinment/:id' , async(req,res)=> {
       const id = req.params.id;
       console.log(id);
       const payment = req.body; 
       const filter = {_id :ObjectId(id)};
       const updateDoc = {
        $set: {
          paid : true,
          transition : payment.transition,
        },
      }
      const result = await bookingappoinments.updateOne(filter,updateDoc)
      const storepayment = await paymentinfo.insertOne(payment)
      res.send(updateDoc)
     })
   

  //  app.patch('/appoinmet/:id' , async(req,res)=> {
  //    const id = req.params.id
  //    const bodyget = req.body
  //    const filter = {id: ObjectId(id)};
  //    const updateDoc = {
  //     $set: {
  //       paid : true ,
  //       transition : bodyget.transition 
  //     },
  //   }
  //   const result = await bookingappoinments.updateOne(filter , updateDoc)
  //   const paymentinfo = await paymentinfo.insertOne(bodyget)
  //   res.send(updateDoc)

  //  } )



    //  make admin role
    app.put('/user/admin/:email', verrifyjwt,verifyadmin, async(req,res)=> {
      const email = req.params.email;    
      const filter= {email: email}
      const updateDoc = {
       $set: {role : "admin"}
     }
     const storeuserinformation = await userinformation.updateOne(filter,updateDoc)
      return res.send(storeuserinformation)  
      
    })


    // app.put('/user/admin/:email', verrifyjwt, async(req,res)=> {
    //   const email = req.params.email;
    //   const requester = req.decoded.email;
    //   const adminsrequester = await userinformation.findOne({email : requester})
    //   if (adminsrequester.role === 'admin'){
    //   const filter= {email: email}
    //   const updateDoc = {
    //    $set: {role : "admin"}
    //  }
    //  const storeuserinformation = await userinformation.updateOne(filter,updateDoc)
    //   return res.send(storeuserinformation)
    //   }
    //   else{
    //    return res.status(403).send({message: "forbidden access"})
    //   }
      
    // })

    //  make role admin end here
      //  app.get('/admin/:email',async(req,res)=>{
      //   const email = req.params.email;
      //   const isadmin = await userinformation.findOne({email: email})
      //   const admins = isadmin.role === "admin"
      //   res.send({admin : admins})
      //  })      
      
      app.get('/admin/:email' , async(req,res)=> {
        const email = req.params.email;
        const checkadminemail = await userinformation.findOne({email : email})
        const iffindemail = checkadminemail.role === 'admin';
        res.send({admin : iffindemail})
      } )


    
     // user information store in db with jwttoken
     app.put('/user/:email',  async(req,res)=> {
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

      // doctor information gret from clients and store indatabase
      app.post('/doctors', verrifyjwt, verifyadmin, async(req,res)=> {
        const doctors = req.body;
        console.log(req.body)
        const getinfo = await doctorsformation.insertOne(doctors)
        res.send(getinfo)
      })

      // doctos information grt from database
      app.get('/doctors', async(req,res)=> {
        const doctorsinfo = await doctorsformation.find().toArray()
        res.send(doctorsinfo)
      })

      // doctors data deleted from db and 
      app.delete('/doctors/:name', async(req,res)=> {
        const name = req.params.name;    
        const filter = {name : name}
        const doctorsinfo = await doctorsformation.deleteOne(filter)
        res.send(doctorsinfo)
      })


      // get payment for services
      app.post("/create-payment-intent", async (req, res)=> {
        const price = req.body ;
        const amounts = price.price;
        console.log(amounts)
        // const prices = {price: price.price}
        const amount = amounts*100 ;
        console.log(amount);
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: 'usd',
          payment_method_types: ['card']     
        });
        res.send({clientSecret: paymentIntent.client_secret});
      })

    //  booking appoinments update payment wise





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
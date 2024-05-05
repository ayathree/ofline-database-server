const express = require('express');
const cors = require('cors');
// task 1
const jwt = require('jsonwebtoken');
// task 7
const cookieParser = require('cookie-parser')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;


// task 4
app.use(cors({
  origin:[
    // 'http://localhost:5173'
    // for jwt deploy
    'https://milkshake-store.web.app',
    'https://milkshake-store.firebaseapp.com'
  ],
  credentials: true
}));
app.use(express.json());
// task 8
app.use(cookieParser());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ycbv1lf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri)

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// task 11
const logger = (req,res,next)=>{
  console.log('log: info',req.method, req.url);
  next()
}

// task 12
const verifyToken = (req,res,next)=>{
  const token= req?.cookies?.token;
  // console.log('token in the middleware', token)
  // task 13
  if (!token) {
    return res.status(401).send({message:'unauthorized access'})
    
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err, decoded)=>{
    if (err) {
      return res.status(401).send({message:'unauthorized access'})
      
    }
    req.user = decoded;
    next()
  })
  // next()

}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const milkCollection = client.db('milkDB').collection('milk');
    // for user
    const milkUserCollection = client.db('milkDB').collection('user')

    // create
    app.post('/milk',async(req,res)=>{
        const newMilk = req.body;
        console.log(newMilk)
        const result = await milkCollection.insertOne(newMilk);
        res.send(result)
    })
    // read
    app.get('/milk', async(req,res)=>{
      const cursor = milkCollection.find();
      const result = await cursor.toArray();
      res.send(result)
  })
  // update
  app.get('/milk/:id', async(req, res)=>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await milkCollection.findOne(query);
    res.send(result)
})
  // delete
  app.delete('/milk/:id', async(req,res)=>{

    const id =req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await milkCollection.deleteOne(query);
    res.send(result)
})
// update
app.put('/milk/:id', async(req,res)=>{
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)}
  const options = {upsert: true};
  const updatedMilk= req.body;
  const milk ={
      $set:{
          name:updatedMilk.name,
          description: updatedMilk.description,
          taste: updatedMilk.taste,
          photo: updatedMilk.photo
      }
      
  }
  const result = await milkCollection.updateOne(filter, milk, options);
  
  res.send(result)
  
})
// create for user
app.post('/newUser',async(req,res)=>{
  const newUser = req.body;
  console.log(newUser)
  const result = await milkUserCollection.insertOne(newUser);
  res.send(result)
})
// read for user
app.get('/newUser', logger, verifyToken, async(req,res)=>{
  // console.log('cookies', req.cookies)
  // task 14
  console.log('token owner info', req.user)
  // you have to focus on car-doctor for this part
  if (!req.user.email) {
    return res.status(403).send({message: 'forbidden access'})
    
  }
  const cursor = milkUserCollection.find();
  // task 9
  
  const result = await cursor.toArray();
  res.send(result)
})
// // update user
// app.get('/newUser/:id', async(req, res)=>{
//   const id = req.params.id;
//   const query = {_id: new ObjectId(id)}
//   const result = await milkUserCollection.findOne(query);
//   res.send(result)
// })
// // update
// app.put('/newUser/:id', async(req,res)=>{
//   const id = req.params.id;
//   const filter = {_id: new ObjectId(id)}
//   const options = {upsert: true};
//   const updatedUser= req.body;
//   const user ={
//       $set:{
          
//           email: updatedUser.email,
          
//       }
      
//   }
//   const result = await milkUserCollection.updateOne(filter, user, options);
  
//   res.send(result)
  
// })



// delete for user
app.delete('/newUser/:id', async(req,res)=>{

  const id =req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await milkUserCollection.deleteOne(query);
  res.send(result)
})
// task 2
// auth related api
app.post('/jwt',logger, async(req,res)=>{
  const user = req.body;
  console.log('user for token',user)
  const token= jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'1h'})
  // task 5

  res.cookie('token', token,{
    httpOnly:true,
    secure: true,
    sameSite:'none'
  })
  .send({success: true})

})
// task 6
app.post('/logout', async(req,res)=>{
  const user =req.body;
  console.log('logging out', user)
  res.clearCookie('token', {maxAge:0}).send({success: true})
})

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);








app.get('/', (req,res)=>{
    res.send('offline server is running')
});

app.listen(port, ()=>{
    console.log(`offline server is running on port: ${port}`)
})



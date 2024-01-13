const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const app = express()
const port = process.env.PORT || 5000;

app.use(express());
app.use(cors())
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://sakif:hvItr3Wb3oQqCfjK@cluster0.w0ws3zg.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const menuCollection = client.db("bistroDb").collection("menu")
    const userCollection = client.db("bistroDb").collection("users")
    const cartCollection = client.db("bistroDb").collection("carts")


    app.post('/jwt',async(req,res)=>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn: '1h'})
      console.log(token)
      res.send({token});
      // res
      // .cookie('token',token,{
      //   httpOnly:true,
      //   secure:true,
      //   sameSite:'none'
      // })
      // .send({success:true})
    })


    // midd

    const verifyToken = async(req,res,next)=>{
      console.log('inside verify',req.headers.authorization)
      // const token = req.headers;
      // console.log('from middleware',token)
      // if(!token){
      //   return res.status(401).send({
      //     message:'not authorized'
            //   })

      if(!req.headers.authorization){
        return res.status(401).send({message:'forbidden access'})
      }
      const token = req.headers.authorization.split(' ')[1]

      jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
        if(err){
          return res.status(401).send({message:'forbidden access'})
        }
        req.decoded = decoded;
        next()
      })

      // if(!token){
      // return res.status(401).send({message:'forbidden access'})
      // }
      }

      app.get('/users/admin/:email',verifyToken,async(req,res)=>{
        const email = req.params.email;
        if(email !== req.decoded.email){
          return res.status(403).send({message:'unauthorized access'})
        }
        const query = {email:email};
        const user = await userCollection.findOne(query);
        let admin = false;
        if(user){
          admin = user?.role === 'admin';
        }
        res.send({admin})
      })



      const verifyAdmin = async(req,res,next)=>{
        const email = req.decoded.email;
        const query = { email:email };
        const user = await userCollection.findOne(query);
        const isAdmin = user?.role === 'admin';
        if(!isAdmin){
          return res.status(403).send({message: 'forbidden access'})
        }
        next()
      }



    app.get('/users',verifyToken,verifyAdmin,async(req,res)=>{
      console.log(req.headers)
      const result = await userCollection.find().toArray();
      res.send(result)
    })


    app.post('/users',async(req,res)=>{
      const user = req.body;
      console.log(user)
      const query = {email:user.email}
      const existingUser = await userCollection.findOne(query)
      if(existingUser){
        return res.send({message: 'user already exists',insertedId:null})
      }
        const result = await userCollection.insertOne(user)
        console.log(result)
        res.send(result)
    })


    app.delete("/users/:id",verifyToken,verifyAdmin,async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
      console.log(result);
    });


    app.patch('/users/admin/:id',verifyToken,verifyAdmin,async(req,res)=>{
      const id = req.params.id;
      const filter = {_id:new ObjectId(id)};
      const updatedDoc = {
        $set:{
          role:'admin'
        }
      }
      const result = await userCollection.updateOne(filter,updatedDoc);
      console.log(result)
      res.send(result)
    })









    app.get('/menu',async(req,res)=>{
      const result = await menuCollection.find().toArray();
      res.send(result)
    })


    app.get('/carts',async(req,res)=>{
      const email = req.query.email;
      const query = {email:email}
      const result = await cartCollection.find(query).toArray();
      res.send(result)
    })



    app.post("/carts",async(req,res)=>{
        const cartItem = req.body;
        console.log(cartItem)
        const result = await cartCollection.insertOne(cartItem)
        console.log(result)
        res.send(result)
    })


    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
      console.log(result);
    });


   


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
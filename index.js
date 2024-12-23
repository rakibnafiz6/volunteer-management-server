require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xd8r6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const volunteerCollection = client.db("volunteerManagement").collection('volunteer');
    
    // all volunteer needs get method
    app.get('/volunteers', async(req, res)=>{
        const query = req.query.search;
        const cursor = volunteerCollection.find({title: {$regex: query, $options: 'i'}});
        const result = await cursor.toArray();
        res.send(result);
    })

    // volunteer needs now
    app.get('/volunteer-need', async(req, res)=>{
        const cursor = volunteerCollection.find().sort({deadline: 1}).limit(6);
        const result = await cursor.toArray();
        res.send(result);
    })

    // volunteer added post
    app.post('/volunteers', async(req, res)=>{
        const volunteerData = req.body;
        const result = await volunteerCollection.insertOne(volunteerData);
        res.send(result);
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res)=>{
    res.send('volunteer management server is running');
})

app.listen(port, ()=>{
    console.log(`volunteer management server is on port: ${port}`);
})

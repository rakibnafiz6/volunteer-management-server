require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors({
   origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next)=>{
    const token = req.cookies?.token;
    if(!token){
        return res.status(401).send({message: 'Unauthorized: No token provided'});
    }

    jwt.verify(token, process.env.DB_SECRET, (err, decoded)=>{
        if(err){
            return res.status(401).send({message: 'Unauthorized: No token provided'});
        }
        req.user = decoded;
        next();
    })

}



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

    const requestCollection = client.db("volunteerManagement").collection('request');

    // create jwt token
    app.post('/jwt', (req, res)=>{
        const user = req.body;
        const token = jwt.sign(user, process.env.DB_SECRET, {expiresIn: '2d'} )

        res.cookie('token', token, {
            httpOnly: true,
            secure: false
        })
        .send({success: true});
    })

    // remove jwt token
    app.post('/logout', (req, res)=>{
    
        res.clearCookie('token', {
            httpOnly: true,
            secure: false
        })
        .send({success: true});
    })





    
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

    // volunteer details
    app.get('/volunteer-details/:id', verifyToken, async(req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await volunteerCollection.findOne(query)
        res.send(result);
    })

    // manage my volunteer post
    app.get('/manage-my-post/:email', verifyToken, async(req, res)=>{
        const email = req.params.email;
        const query = {organizer_email: email};
        if(req.user.email !== email){
            return res.status(403).send({message: 'Forbidden: Invalid token'})
        }
        const result = await volunteerCollection.find(query).toArray();
        res.send(result);
    })

    // get data with update volunteer post
    app.get('/update-volunteer/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await volunteerCollection.findOne(query)
        res.send(result);
    })

    // get data with be a volunteer post
    app.get('/volunteer/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await volunteerCollection.findOne(query)
        res.send(result);
    })

    // get method with my volunteer request
    app.get('/my-request/:email', verifyToken, async(req, res)=>{
        const email = req.params.email;
        const query = { volunteerEmail: email}
        if(req.user.email !== email){
            return res.status(403).send({message: 'Forbidden: Invalid token'})
        }
        const result = await requestCollection.find(query).toArray();
        res.send(result);
    })

    // volunteer added post
    app.post('/volunteers', verifyToken, async(req, res)=>{
        const volunteerData = req.body;
        const result = await volunteerCollection.insertOne(volunteerData);
        res.send(result);
    })

    // volunteer request post
    app.post('/request', async(req, res)=>{
        const volunteerData = req.body;
        const result = await requestCollection.insertOne(volunteerData);
        // const filter = {_id: new ObjectId(volunteerData.id)}
        // const update = { $inc: {volunteer: -1}}
        // const updateVolunteerNo = await volunteerCollection.updateOne(filter, update)
        // console.log(updateVolunteerNo);
        res.send(result);
    })

    // update volunteer post
    app.put('/updatePost/:id', verifyToken, async(req, res)=>{
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)};
        const options = { upsert: true };
        const updateVolunteer = req.body;
        const updatePost = {
            $set: {
                thumbnail: updateVolunteer.thumbnail,
                title: updateVolunteer.title,
                description: updateVolunteer.description,
                category: updateVolunteer.category,
                location: updateVolunteer.location,
                volunteer: updateVolunteer.volunteer,
                deadline: updateVolunteer.deadline,
            }
        }
        const result = await volunteerCollection.updateOne(filter, updatePost, options);
        res.send(result);
    })

    // volunteer post delete
    app.delete('/volunteers/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await volunteerCollection.deleteOne(query);
        res.send(result);
    })

    // My volunteer request delete
    app.delete('/my-request/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await requestCollection.deleteOne(query);
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

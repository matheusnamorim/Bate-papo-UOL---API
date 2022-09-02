import express from 'express';
import cors from  'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const server = express();
server.use(express.json());
server.use(cors());

const mongoClient = new MongoClient(process.env.MONGO_URI); 
let db;

mongoClient.connect(() => {
    db = mongoClient.db('BateBapoUOL');
});

server.get('/participants', (req,res) => {
    db.collection('participants').find().toArray().then(data => {
        res.send(data);
    });
});

server.listen(5000, () => console.log('Listening on port 5000'));
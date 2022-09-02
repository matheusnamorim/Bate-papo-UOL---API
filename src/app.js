import express from 'express';
import cors from  'cors';
import joi from 'joi';
import { MongoClient } from 'mongodb';
import dayjs from 'dayjs';
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

const userSchema = joi.object({
    name: joi.string().min(1).required()
});

server.get('/participants', (req,res) => {
    
    db.collection('participants').find().toArray().then(data => {
        res.send(data);
    });
});

server.post('/participants', async (req, res) => {

    let arrayParticipants = [];
    const body = req.body;
    const validation = userSchema.validate(body);

    if(validation.error) {
        const message = validation.error.details.map(value => value.message);
        res.status(422).send(message);
    }

    try {
        arrayParticipants = await db.collection('participants').find().toArray();
    } catch (error) {
        res.status(500).send(error.message);
    }

    if(arrayParticipants.find(value => value.name === req.body.name) !== undefined){
        res.sendStatus(409);
    }else{
        db.collection('participants').insertOne({name: req.body.name, lastStatus: Date.now()});
        db.collection('messages').insertOne({
            from: req.body.name, 
            to: 'Todos', 
            text: 'entra na sala...', 
            type: 'status', 
            time: dayjs().format('hh:mm:ss')})
        res.sendStatus(201);
    }
    
});
server.listen(5000, () => console.log('Listening on port 5000'));
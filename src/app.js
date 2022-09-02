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
    db = mongoClient.db('BatePapoUOL');
});

const userSchema = joi.object({
    name: joi.string().trim().required()
});

const userSchema2 = joi.object({
    to: joi.string().trim().required(),
    text: joi.string().trim().required(),
    type: joi.string().valid('message', 'private_message').required()
});

server.get('/participants', async (req,res) => {
    
    let arrayParticipants = [];
    try {
        arrayParticipants = await db.collection('participants').find().toArray();
        arrayParticipants.map(value => delete value._id);
        res.send(arrayParticipants);
    } catch (error) {
        res.status(500).send(error.message);
        return;
    }

});

server.post('/participants', async (req, res) => {

    let arrayParticipants = [];
    const validation = userSchema.validate(req.body);

    if(validation.error) {
        const message = validation.error.details.map(value => value.message);
        res.status(422).send(message);
        return;
    }

    try {
        arrayParticipants = await db.collection('participants').find().toArray();
    } catch (error) {
        res.status(500).send(error.message);
        return;
    }

    if(arrayParticipants.find(value => value.name === req.body.name) !== undefined){
        res.sendStatus(409);
        return;
    }else{
        db.collection('participants').insertOne({name: req.body.name, lastStatus: Date.now()});
        db.collection('messages').insertOne({
            from: req.body.name, 
            to: 'Todos', 
            text: 'entra na sala...', 
            type: 'status', 
            time: dayjs().format('hh:mm:ss')})
        res.sendStatus(201);
        return;
    }
    
});

server.get('/messages', async (req, res) => {

    const { user } = req.headers;
    const { limit } = req.query;
    try {
        const arrayMessages = await db.collection('messages').find().toArray();
        arrayMessages.map(value => delete value._id);

        const messagesFiltered = arrayMessages.filter(value => {
            if(value.type === 'private_message' && (value.from === user || value.to === user || value.to === 'Todos') || 
            value.type === 'message' || value.type === 'status')
                return value;
        });
        if(Number.isInteger(Number(limit))){
          let tam = messagesFiltered.length - limit;
          if(tam < 0) tam = 0;
          res.send(messagesFiltered.filter((value, index) => {
            if(index >= tam) {
                return value;
            }
        }));  
        }else 
            res.send(messagesFiltered);
    } catch (error) {
        res.status(500).send(error.message);
        return;
    }
});

server.post('/messages', async (req, res) => {
    
    const { user } = req.headers;
    const validation = userSchema2.validate(req.body, { abortEarly: false });

    if(validation.error){
        const message = validation.error.details.map(value => value.message);
        res.status(422).send(message);
        return;
    }
    try {
        const arrayParticipants = await db.collection('participants').find().toArray();
        if(arrayParticipants.find(value => value.name === user) === undefined) {
            res.sendStatus(422);
            return;
        }
        db.collection('messages').insertOne({
            from: user, 
            ...req.body,
            time: dayjs().format('HH:mm:ss')
        });
        res.sendStatus(201);
        return;
    } catch (error) {
        res.status(500).send(error.message);
        return;
    }
});

server.post('/status', async (req, res) => {
    const { user } = req.headers;
    try {
        const arrayParticipants = await db.collection('participants').find().toArray();
        if(arrayParticipants.find(value => value.name === user) === undefined){
            res.sendStatus(404);
            return;
        }
        db.collection('participants').updateOne({name: user}, {$set: {lastStatus: Date.now()}});
        res.sendStatus(200);
        return;
    } catch (error) {
        res.status(500).send(error.message);
        return;
    }
});

server.listen(5000, () => console.log('Listening on port 5000'));
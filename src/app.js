import express from 'express';
import cors from  'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const server = express();
server.use(express.json());
server.use(cors());


server.listen(5000, () => console.log('Listening on port 5000'));
import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')));

app.use(bodyParser.json());

const withDBConceptual = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db('conceptual-db');
    
        await operations(db);
    
        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error connecting to db', error });
    }
}

app.get('/api/questions/:topic', async (req, res) => {
    withDBConceptual(async (db) => {
        const topicName = req.params.topic;

        if(topicName === "random practice") {
            const questionInfo = await db.collection('questions').aggregate([{$sample:{size:15}}]).toArray( (err, result) => {
                if (err) {
                    res.status(400).send("Error fetching listings!");
                } else {
                    res.status(200).json(result);
                }    
            })
        } else {
            const questionInfo = await db.collection('questions').find({ topic: topicName }).limit(1000).toArray( (err, result) => {
                if (err) {
                    res.status(400).send("Error fetching listings!");
                } else {
                    res.status(200).json(result);
                }    
            }) 
        }
    }, res);
})

app.get('/api/codesnippets/:topic', async (req, res) => {
    withDBConceptual(async (db) => {
        const topicName = req.params.topic;

        const questionInfo = await db.collection('codesnippets').find({ topic: topicName }).limit(1000).toArray( (err, result) => {
            if (err) {
                res.status(400).send("Error fetching listings!");
             } else {
                res.status(200).json(result);
             }    
        })
    }, res);
})


app.post('/api/add-questions', async (req, response) => {
    withDBConceptual(async (db) => {

        const questionInfo = {
            topic: req.body.topic,
            question: req.body.question,
            answer: req.body.answer
        };
    
        await db.collection('questions').insertOne(questionInfo, function (err, res)  {
            if(err) throw err;
            response.json(res);
        });
    }, response);
});

app.post('/api/add-code-snippet', async (req, response) => {
    withDBConceptual(async (db) => {

        const snippetInfo = {
            topic: req.body.topic,
            description: req.body.question,
            codeBlock: req.body.codeBlock
        };
    
        await db.collection('codesnippets').insertOne(snippetInfo, function (err, res)  {
            if(err) throw err;
            response.json(res);
        });
    }, response);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(8000, () => console.log('Listening on port 8000'));
import express from 'express';

const app = express();

app.use(express.json());


app.listen(8000, ()=> {
    console.log('Listening to server 8000')
})
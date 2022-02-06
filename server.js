require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const api = express.Router();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

const PORT = process.env.PORT || 5500;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const shortenerSchema = new mongoose.Schema({
    "original_url": String, 
    "short_url": Number,
    "date_unix": Number
})

const shortener = mongoose.model('shortener', shortenerSchema);

const createAndSaveURL = async (original_url, done) => {
    
    const new_idx = await shortener.count({});

    const entry = new shortener({
        "original_url": original_url, 
        "short_url": new_idx,
        "date_unix": Date.now()
    });

    entry.save(done);
};

const findURL = (short_url, done) => {
    shortener.findOne({"short_url": short_url}, done);
};

api.get('/', (req, res) => {
    res.send("hi from the api side");
});

api.get('/shorturl/:url_code', (req, res) => {

    findURL(req.params.url_code, (err, data) => {

        if(err){
            console.log(err);
            return res.json({
                "error": err,
            })
        }

        if(!data){
            console.log(`error: code ${req.params.url_code} invalid or not found.`);
            return res.json({
                "error": "some error happened, probably the url your shorturl code is invalid or unused, check the logs if you have access to them."
            })
        }

        console.log(data);
        return res.redirect(data.original_url);
    });
});

api.post('/shorturl', (req, res) => {

    const valid = req.body.url.match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/);

    if (!valid) {
        return res.json({
            error: 'invalid url'
        });
    }

    createAndSaveURL(req.body.url, (err, data) => {

        if(err){
            console.log(err);
            return res.json({
                "error": err,
            })
        }

        console.log(data);
        return res.json({
            "original_url": data.original_url,
            "short_url": data.short_url
        });
    });
});

app.use(cors());
app.use((req, res, next) => {
    console.log(`${req.method} - ${req.path} : ${req.ip}`);
    next();
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.use("/public", express.static(__dirname + '/public'));

app.use('/api', api);

app.use((req, res) => {
    res.status(404).type("txt").send("404 Not Found");
});

app.listen(PORT, () => {
    console.log('Node is listening on port ' + PORT + '...');
});
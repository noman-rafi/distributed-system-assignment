const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const connectionString = 'mongodb+srv://shopOwner:admin123@cluster0.d4f3j.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

var db;
var vouchersCollection;


app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');


var dbConnection = MongoClient.connect(connectionString, { useUnifiedTopology: true });

app.get('/', (req, res) => {
    dbConnection.then(client => {
        console.log('Connected to Database')
        db = client.db('vouchers')
        vouchersCollection = db.collection('vouchers')
        vouchersCollection.find().toArray()
            .then(results => {
                //console.log(results);
                res.render('index.ejs', {
                    vouchers: results
                });

            })
            .catch(error => {
                console.log('Error fetching vouchers')
                console.error(error)
            })
    })
})

app.post('/createVoucher', (req, res) => {
    //console.log('Request body : ' + JSON.stringify(req.body));
    dbConnection.then(client => {
        console.log('Connected to Database')
        db = client.db('vouchers')
        vouchersCollection = db.collection('vouchers')
        var voucherData = {
            "orderID": req.body.orderID,
            "voucherAmount": req.body.voucherAmount
        }
        vouchersCollection.insertOne(voucherData)
            .then(result => {
                res.send({
                    voucherStatus: 'success'
                });
                console.log('Voucher Created Successfully');
            })
            .catch(error => {
                console.error(error)
                res.send({
                    voucherStatue: 'failure'
                });
            })
    })
})

app.listen(3001, function() {
    console.log('listening on 3001');
})

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const connectionString = 'mongodb+srv://shopOwner:admin123@cluster0.d4f3j.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

app.use(bodyParser.urlencoded({
        extended: true
    }))
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

MongoClient.connect(connectionString, {
    useUnifiedTopology: true
})
.then(client => {
    console.log('Connected to Database')
    const db = client.db('vouchers')
        const vouchersCollection = db.collection('vouchers')

        app.get('/', (req, res) => {
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

        app.post('/createVoucher', (req, res) => {
            //console.log('Request body : ' + JSON.stringify(req.body));
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
.catch(error => console.error(error))

app.listen(3001, function () {
    console.log('listening on 3001');
})
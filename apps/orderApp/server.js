const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const MongoClient = require('mongodb').MongoClient;
const cron = require('node-cron');

// Database Connection
const connectionString = 'mongodb+srv://shopOwner:admin123@cluster0.d4f3j.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

// Voucher API server url
const voucherApi = {
    server: 'http://localhost:3001'
};
const voucherAmount = 5;
var db;
var ordersCollection;

const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json()); // for handling json data
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs'); // set EJS as view engine

var dbConnection = MongoClient.connect(connectionString, { useUnifiedTopology: true });

// Schedule to retry creating vouchers for failed transactions
cron.schedule('* * * * *', function() { // This job will run every minute
    console.log('Running cron job');
    retryFailedVouchers();
})

// Main html page for placing order
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

app.post('/placeOrder', (req, res) => {
    dbConnection.then(client => {
            console.log('Connected to Database')
            db = client.db('orders')
            ordersCollection = db.collection('orders')

            req.body["status"] = "sent"
            if (req.body.orderAmount > 100) {
                req.body["voucherStatus"] = "PENDING"
            }
            ordersCollection.insertOne(req.body)
                .then(result => {
                    if (req.body.orderAmount > 100) {
                        var voucherRequest = {
                            "orderID": result.ops[0]._id,
                            "voucherAmount": voucherAmount
                        };

                        createVoucher(voucherRequest, result.ops[0]._id);
                    }
                    res.redirect('/')
                })
                .catch(error => {
                    console.log('Error creating order')
                        //console.error(error)
                })
        })
        .catch(error => console.error(error))
})

app.get('/showOrders', (req, res) => {
    dbConnection.then(client => {
            console.log('Connected to Database')
            db = client.db('orders')
            ordersCollection = db.collection('orders')
            ordersCollection.find().toArray()
                .then(results => {
                    //console.log(results);
                    res.render('ordersView.ejs', {
                        orders: results
                    });

                })
                .catch(error => {
                    console.log('Error fetching orders')
                    console.error(error)
                    res.redirect('/')
                })
        })
        .catch(error => console.error(error))
})

// This will retry generating vouchers for orders worth 100+, whose vouchers failed to be created
function retryFailedVouchers() {
    dbConnection.then(client => {
            console.log('Connected to Database')
            db = client.db('orders')
            ordersCollection = db.collection('orders')
            console.log('Fetching orders with failed vouchers');
            ordersCollection.find({
                    voucherStatus: "ERROR"
                }).toArray()
                .then(results => {
                    results.forEach(function(item) {
                        //console.log(item);
                        var voucherRequest = {
                            "orderID": item._id,
                            "voucherAmount": voucherAmount
                        };
                        createVoucher(voucherRequest, item._id);
                    });
                })
                .catch(error => {
                    console.log('Error fetching orders')
                    console.error(error)
                })
            return;
        })
        .catch(error => console.error(error))
}

// API request to generate a voucher
function createVoucher(requestData, orderID) {
    //console.log('Voucher request Data :' + JSON.stringify(requestData));
    dbConnection.then(client => {
            console.log('Connected to Database')
            db = client.db('orders')
            ordersCollection = db.collection('orders')
            console.log('Sending voucher request');
            axios({
                method: 'post',
                url: voucherApi.server + "/createVoucher",
                data: requestData
            }).then((response) => {
                console.log(response.data);
                // update voucher status 
                ordersCollection.findOneAndUpdate({
                        _id: orderID
                    }, {
                        $set: {
                            'voucherStatus': 'SUCCESS'
                        }
                    })
                    .then(results => {
                        console.log('Updated voucher status')
                            //console.log(results)
                    })
                    .catch(error => {
                        console.log('Error updating voucher status')
                        console.error(error)
                    })

            }).catch(error => {
                console.log('Error creating voucher')
                    //console.error(error)

                ordersCollection.findOneAndUpdate({
                        _id: orderID
                    }, {
                        $set: {
                            'voucherStatus': 'ERROR'
                        }
                    })
                    .then(results => {
                        console.log('Updated voucher status')
                            //console.log(results)
                    })
                    .catch(error => {
                        console.log('Error updating voucher status')
                        console.error(error)
                    })

            });
            return;
        })
        .catch(error => console.error(error))
}

app.listen(3000, function() {
    console.log('listening on 3000');
})
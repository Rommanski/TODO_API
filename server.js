var express = require('express');
var app = express();

var middleware = require('./middleware.js');

app.use(middleware.logger);

app.get('/', function (req, response) {
    response.send('Hello Express!');
});

app.get('/about', function (req, response) {
    response.send('This is my about page');
});

app.use(express.static(__dirname + '/public'));
app.listen(3000, function() {
    console.log('Exprese server started');
});

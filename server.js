var express = require('express');
var app = express();
var PORT = process.env.PORT || 3000;

var middleware = require('./middleware.js');

app.use(middleware.logger);

app.get('/', function (req, response) {
    response.send('Hello Express!');
});

app.get('/about', function (req, response) {
    response.send('This is my about page');
});

app.use(express.static(__dirname + '/public'));
app.listen(PORT, function() {
    console.log('Exprese server started at port: ' + PORT);
});

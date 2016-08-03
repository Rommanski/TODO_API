var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [{
    id: 1,
    description: 'Meet mom for lunch',
    completed: false
}, {
    id: 2,
    description: 'Go to market',
    completed: true
}];
var nextId = 3;

app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('Todo API Root');
});

// GET /todos
app.get('/todos', function (req, res) {
    res.json(todos);
});

// GET /todos/:
app.get('/todos/:id', function(req, res) {
    var todoId = parseInt(req.params.id);
    var matchTodo = _.findWhere(todos, {id : todoId});

    if (matchTodo) {
        res.json(matchTodo);
    } else {
        res.status(404).send("Resource doesn't found");
    }
});

// POST /todos
app.post('/todos', function(req, res) {
    var body = _.pick(req.body, 'description', 'completed');
    if ( !_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0 ) {
        return res.status(400).send();
    }

    body.id = nextId++;
    body.description =  body.description.trim();
    todos.push( body );
    res.send(body);
});

app.listen(PORT, function() {
    console.log('Exprese server started at port: ' + PORT);
});

var express = require('express');
var bodyParser = require('body-parser');

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
    var matchTodo;

    // Iterate of todos array. Find the match
    todos.forEach( function(todo) {
        if (todoId === todo.id) {
            matchTodo = todo;
        }
    } );

    if (matchTodo) {
        res.json(matchTodo);
    } else {
        res.status(404).send("Resource doesn't found");
    }
});

// POST /todos
app.post('/todos', function(req, res) {
    var body = req.body;
    body.id = nextId++;

    todos.push( body );
    res.send(body);
});

app.listen(PORT, function() {
    console.log('Exprese server started at port: ' + PORT);
});

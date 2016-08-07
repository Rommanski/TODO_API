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

// GET /todos?completed=true&description=work
app.get('/todos', function (req, res) {
    var queryParams = req.query;
    var filteredTotdos = todos;

    if ( queryParams.hasOwnProperty('completed') ) {
        if ( queryParams.completed === 'true' ) {
            filteredTotdos = _.findWhere(filteredTotdos, {completed: true});
        } else if ( queryParams.completed === 'false' ) {
            filteredTotdos = _.findWhere(filteredTotdos, {completed: false});
        }
    }

    if ( queryParams.hasOwnProperty('description') ) {
        filteredTotdos = _.filter(filteredTotdos, function(obj) {
            return -1 != obj.description.toLowerCase().indexOf(queryParams.description.toLowerCase());
        });
    }

    res.json(filteredTotdos);
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

// DELETE /todos/:id
app.delete('/todos/:id', function(req, res) {
    var todoId = parseInt(req.params.id);
    var matchedTodo = _.findWhere(todos, {id : todoId});
    if ( !matchedTodo ) {
        res.status(404).json({"error" : "no todo found"});
    }

    todos = _.without( todos, matchedTodo );
    return res.json(matchedTodo);
});

// PUT /todos/:id
app.put('/todos/:id', function(req, res) {
    var body = _.pick(req.body, 'description', 'completed');
    var validateAttributes = {};
    var todoId = parseInt(req.params.id);
    var matchedTodo = _.findWhere(todos, {id : todoId});

    // if todo doesn't  exist
    if (!matchedTodo) {
        return res.status(404).send();
    }

    // validate completed
    if ( body.hasOwnProperty('completed') && _.isBoolean(body.completed) )  {
        validateAttributes.completed = body.completed;
    } else if (body.hasOwnProperty('completed')) {
        res.status(400).send();
    }

    // validate description
    if ( body.hasOwnProperty('description') && _.isString(body.description) )  {
        validateAttributes.description = body.description;
    } else if (body.hasOwnProperty('description')) {
        res.status(400).send();
    }

    _.extend(matchedTodo, body);
    return res.json(matchedTodo);

});

app.listen(PORT, function() {
    console.log('Exprese server started at port: ' + PORT);
});

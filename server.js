var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var bcrypt = require('bcrypt');
var db = require('./db.js');
var middleware = require('./middleware.js')(db);

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
app.get('/todos', middleware.requireAuthentification, function (req, res) {
    var query = req.query;
    var where = {};

    if ( query.hasOwnProperty('completed') ) {
        if ( 'true' === query.completed ) {
            where.completed = true;
        }

        if ( 'false' === query.completed ) {
            where.completed = false;
        }
    }

    if ( query.hasOwnProperty('description') ) {
        where.description = {
                $like : '%' + query.description + '%'
        };
    }

    db.todo.findAll({where: where}).then(function(todos) {
        res.json(todos);
    }, function(e) {
        res.status(500).send();
    });
});

// GET /todos/:id
app.get('/todos/:id', middleware.requireAuthentification, function(req, res) {
    var todoId = parseInt(req.params.id);
    db.todo.findById(todoId).then( function(todo) {
        if (!!todo) {
            res.json(todo.toJSON());
        } else {
            res.status(404).json({"error" : "no todo found"});
        }
    }, function(e) {
        res.status(500).send();
    } );
});

// POST /todos
app.post('/todos', middleware.requireAuthentification, function(req, res) {
    var body = _.pick(req.body, 'description', 'completed');

    db.todo.create(body).then( function(todo) {
        res.json(todo.toJSON());
    }, function(e) {
        res.status(400).json(e);
    });
});

// DELETE /todos/:id
app.delete('/todos/:id', middleware.requireAuthentification, function(req, res) {
    var todoId = parseInt(req.params.id);

    db.todo.destroy({
        where: {
            id: todoId
        }
    }).then(function(rowsDeleted) {
        if (rowsDeleted === 0) {
            res.status(404).json({
                error: 'No todo with id'
            });
        } else {
            res.status(204).send();
        }
    }).then(function(e) {
        res.status(500).send();
    });
});

// PUT /todos/:id
app.put('/todos/:id', middleware.requireAuthentification, function(req, res) {
    var body = _.pick(req.body, 'description', 'completed');
    var attributes = {};
    var todoId = parseInt(req.params.id);

    // validate completed
    if ( body.hasOwnProperty('completed') )  {
        attributes.completed = body.completed;
    }

    // validate description
    if ( body.hasOwnProperty('description') )  {
        attributes.description = body.description;
    }

    db.todo.findById(todoId).then(function(todo) {
        if ( !!todo ) {
            todo.update(attributes).then(function(todo) {
                return res.json(todo.toJSON());
            }, function(e) {
                res.status(400).json(e);
            });
        } else {
            res.status(404).send();
        }
    }, function() {
        res.status(500).send();
    });
});

// POST /user
app.post('/users', function(req, res) {
    var body = _.pick(req.body, 'email', 'password');

    db.user.create(body).then( function(user) {
        res.json(user.toPublicJSON());
    }, function(e) {
        res.status(400).json(e);
    });
});

// POST /users/login
app.post('/users/login', function(req, res) {
    var body = _.pick(req.body, 'email', 'password');

    db.user.authentificate(body).then( function (user) {
        var token = user.generateToken('authentification');
        if (token) {
            res.header("Auth", token).json(user.toPublicJSON());
        }

        res.status(401).send();
    }, function () {
        res.status(401).send();
    } );
});

db.sequelize.sync().then( function() {
    app.listen(PORT, function() {
        console.log('Exprese server started at port: ' + PORT);
    });
} );

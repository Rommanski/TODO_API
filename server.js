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

app.use('/documentation', express.static(__dirname + '/doc'));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('Todo API Root');
});

/**
 * @api {get} /todos/ Get Todo
 * @apiName Get Todo
 * @apiGroup Todo
 * @apiHeader {String} Auth Authorization token
 * @apiParam {Boolean} completed Returns only completed todo
 * @apiParam {String} description Returns todo with mathced description
 *
 * @apiSuccess {Object[]} Array List of todo
 * @apiVersion 1.0.0
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 [
  {
    "id": 1,
    "description": "Walk a cat",
    "completed": true,
    "createdAt": "2016-08-20T14:21:28.348Z",
    "updatedAt": "2016-08-20T14:21:28.358Z",
    "userId": 1
  },
  {
    "id": 2,
    "description": "Walk a dog",
    "completed": true,
    "createdAt": "2016-08-20T14:22:27.542Z",
    "updatedAt": "2016-08-20T14:22:27.546Z",
    "userId": 1
  }
]
 */
app.get('/todos', middleware.requireAuthentification, function (req, res) {
    var query = req.query;
    var where = {userId : req.user.id};

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

/**
 * @api {get} /todos/{id} Get Todo By Id
 * @apiName Get Todo By Id
 * @apiGroup Todo
 * @apiDescription Get todo object by id
 * @apiVersion 1.0.0
 * @apiHeader {String} Auth Authorization token
 *
 * @apiSuccess {Object}  Todo object with seted id
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 {
   "id": 1,
   "description": "Walk a cat",
   "completed": true,
   "createdAt": "2016-08-20T14:21:28.348Z",
   "updatedAt": "2016-08-20T14:21:28.358Z",
   "userId": 1
 }
 */
app.get('/todos/:id', middleware.requireAuthentification, function(req, res) {
    var todoId = parseInt(req.params.id);
    db.todo.findOne( {
        where : {
            id : todoId,
            userId : req.user.id
        }
    }).then( function(todo) {
        if (!!todo) {
            if (todo.userId == req.user.id) {
                res.json(todo.toJSON());
            } else {
                res.status(404).send();
            }
        } else {
            res.status(404).json({"error" : "no todo found"});
        }
    }, function(e) {
        res.status(500).send();
    } );
});

/**
 * @api {post} /todos/:id Create Todo
 * @apiName Delete Todo
 * @apiHeader {String} Auth Authorization token
 * @apiDescription Create new todo object
 * @apiGroup Todo
 * @apiVersion 1.0.0
 *
 * @apiSuccess {Object}  Todo Created todo object
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 {
   "id": 1,
   "description": "Walk a cat",
   "completed": true,
   "createdAt": "2016-08-20T14:21:28.348Z",
   "updatedAt": "2016-08-20T14:21:28.358Z",
   "userId": 1
 }
 */
app.post('/todos', middleware.requireAuthentification, function(req, res) {
    var body = _.pick(req.body, 'description', 'completed');

    db.todo.create(body).then( function(todo) {
        req.user.addTodo(todo).then( function() {
            return todo.reload();
        }).then(function(todo) {
            res.json(todo.toJSON());
        });
    }, function(e) {
        res.status(400).json(e);
    });
});

/**
 * @api {delete} /todos/:id Delete Todo
 * @apiName Create Todo
 * @apiHeader {String} Auth Authorization token
 * @apiGroup Todo
 * @apiDescription Deleted todo with seted id
 * @apiVersion 1.0.0
 */
app.delete('/todos/:id', middleware.requireAuthentification, function(req, res) {
    var todoId = parseInt(req.params.id);

    db.todo.destroy({
        where: {
            id: todoId,
            userId : req.user.id
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


/**
 * @api {put} /todos/:id Edit Todo
 * @apiName Edit Todo
 * @apiGroup Todo
 * @apiHeader {String} Auth Authorization token
 * @apiDescription Edit todo with seted id
 * @apiVersion 1.0.0
 *
 * @apiSuccess {Object} Todo Modified todo object
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 {
   "id": 1,
   "description": "Walk a cat",
   "completed": true,
   "createdAt": "2016-08-20T14:21:28.348Z",
   "updatedAt": "2016-08-20T14:21:28.358Z",
   "userId": 1
 }
 */
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

    db.todo.findOne( {
        where : {
            id : todoId,
            userId : req.user.id
        }
    }).then(function(todo) {
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


/**
 * @api {post} /users Sign Up
 * @apiName Sign Up
 * @apiGroup User
 * @apiDescription Sign up user
 * @apiVersion 1.0.0
 *
 * @apiSuccess {Object} User Created user object
 * @apiParamExample {json} Request-Example:
 * {
 * "email" : "dmytro.bohachevskyy@gmail.com",
 * "password" : "qwerty"
 * }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "id": 1,
 *  "email": "dmytro.bohachevskyy@gmail.com",
 *  "updatedAt": "2016-08-20T14:19:13.501Z",
 *  "createdAt": "2016-08-20T14:19:13.501Z"
 * }
 */
app.post('/users', function(req, res) {
    var body = _.pick(req.body, 'email', 'password');

    db.user.create(body).then( function(user) {
        res.json(user.toPublicJSON());
    }, function(e) {
        res.status(400).json(e);
    });
});

/**
 * @api {post} /users Sign In
 * @apiName Sign In
 * @apiGroup User
 * @apiDescription
 * Sign In to the system.
 * In response headers you can take token fox accessing to the data.
 * @apiVersion 1.0.0
 *
 * @apiSuccess {Object} User User object with user information
 * @apiParamExample {json} Request-Example:
 * {
 * "email" : "dmytro.bohachevskyy@gmail.com",
 * "password" : "qwerty"
 * }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "id": 1,
 *  "email": "dmytro.bohachevskyy@gmail.com",
 *  "updatedAt": "2016-08-20T14:19:13.501Z",
 *  "createdAt": "2016-08-20T14:19:13.501Z"
 * }
 */
app.post('/users/login', function(req, res) {
    var body = _.pick(req.body, 'email', 'password');
    var userInstance;
    console.log('/users/login');

    db.user.authentificate(body).then( function (user) {
        var token = user.generateToken('authentification');
        userInstance = user;

        return db.token.create({
            token : token
        });
    }).then(function(tokenInstance) {
        res.header("Auth", tokenInstance.token).json(userInstance.toPublicJSON());
    }).catch( function (e) {
        console.log(e);
        res.status(401).send();
    } );
});

/**
 * @api {delete} /users Logout
 * @apiName Logout
 * @apiGroup User
 * @apiDescription
 * @apiHeader {String} Auth Authorization token
 * Logout from system
 * @apiVersion 1.0.0
 */
app.delete('/users/login', middleware.requireAuthentification, function (req, res) {
	req.token.destroy().then(function () {
		res.status(204).send();
	}).catch(function () {
		res.status(500).send();
	});
});

db.sequelize.sync({force : true}).then( function() {
    app.listen(PORT, function() {
        console.log('Exprese server started at port: ' + PORT);
    });
} );

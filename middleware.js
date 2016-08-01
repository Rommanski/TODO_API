var middleware = {
    requireAuthentification: function(req, res, next) {
        console.log('private route here');
        next();
    },
    logger: function(req, res, next) {
        console.log('Request: ' + req.method + ' ' + req.originalUrl + ' ' + new Date().toString());
        next();
    },
};

module.exports = middleware;

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// declare routes
var indexRouter = require('./routes/index');
var gameRouter = require('./routes/game');
var apiRouter = require('./routes/api');

// initialize web app
var app = express();

// declare middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// map routes
app.use('/', indexRouter);
app.use('/game', gameRouter);
app.use('/api', apiRouter);

module.exports = app;

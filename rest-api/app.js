const cors = require('cors');
const express = require('express');
const logger = require('morgan');

const annotationsRouter = require('./routes/annotations');
const areasRouter = require('./routes/areas');
const campaignsRouter = require('./routes/campaigns');
const feedbackRouter = require('./routes/feedback');
const loginRouter = require('./routes/login');
const searchRouter = require('./routes/search');
const sourcesRouter = require('./routes/sources');
const statsRouter = require('./routes/stats');
const usersRouter = require('./routes/users');

const app = express();
module.exports = app;

// enable HTTP logger if mocha is not running
if (!global.it) app.use(logger('combined'));
// enable middleware to parse JSON payloads
app.use(express.json({ limit: "1mb" }));
// enable middleware to parse urlencoded payloads
app.use(express.urlencoded({extended: false}));
// enable middleware for cross-origin resource sharing
app.use(cors())

// set routes
app.use('/api/v1/annotations', annotationsRouter);
app.use('/api/v1/areas', areasRouter);
app.use('/api/v1/campaigns', campaignsRouter);
app.use('/api/v1/feedback', feedbackRouter);
app.use('/api/v1/login', loginRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/sources', sourcesRouter);
app.use('/api/v1/stats', statsRouter);
app.use('/api/v1/users', usersRouter);

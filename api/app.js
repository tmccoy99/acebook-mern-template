const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const JWT = require('jsonwebtoken');
const multer = require('multer');

const postsRouter = require('./routes/posts');
const tokensRouter = require('./routes/tokens');
const usersRouter = require('./routes/users');
const accountRouter = require('./routes/account');

const app = express();

// Setup for receiving JSON and multi-part form data (e.g. image uploads)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup for multer to handle file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images');
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + '-' + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: storage });

app.use(logger('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// middleware function to check for valid tokens
const tokenChecker = (req, res, next) => {
  let token;
  const authHeader = req.get('Authorization');

  if (authHeader) {
    token = authHeader.slice(7);
  }

  JWT.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      console.log(err);
      res.status(401).json({ message: 'auth error' });
    } else {
      req.user_id = payload.user_id;
      next();
    }
  });
};

// route setup
app.use('/posts', tokenChecker, postsRouter);
app.use('/tokens', tokensRouter);
app.use('/users', usersRouter);
app.use('/account', tokenChecker, accountRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // respond with details of the error
  res.status(err.status || 500).json({ message: 'server error' });
});

module.exports = app;

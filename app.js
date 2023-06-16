const app = require('express')();
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const greaphqlSchema = require('./graphql/schema');
const graphqlResolvers = require('./graphql/resolver');
const auth = require('./middleware/auth');

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const CONNECTION_STRING = '';
const { graphqlHTTP } = require('express-graphql');

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded
app.use(bodyParser.json()); // application/json
app.use('/images', express.static(path.join(__dirname, 'images')));

//image upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images');
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else cb(null, false);
};

//cors setup
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT , PATCH, DELETE, OPTIONS',
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method == 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(multer({ storage: storage, fileFilter: fileFilter }).single('image'));
app.use(auth);

app.put('/post-image', (req, res, next) => {
  if (!req.isAuth) {
    throw new Error('Not authenticated');
  }
  if (!req.file) {
    return res.status(200).json({ message: 'No File Provided!' });
  }

  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }

  return res
    .status(201)
    .json({ message: 'File stored', filePath: req.file.path });
});

//graphql

app.use(
  '/graphql',
  graphqlHTTP({
    schema: greaphqlSchema,
    rootValue: graphqlResolvers,
    graphiql: true,
    formatError(err) {
      if (!err.originalError) {
        return err;
      }

      const data = err.originalError.data;
      const message = err.message || 'An error occurred';
      const code = err.originalError.code || 500;

      return { message: message, status: code, data: data };
    },
  }),
);

//error middleware
app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({
    message: message,
    data: data,
  });
});

//mongoose conection + server init
mongoose
  .connect(CONNECTION_STRING)
  .then((result) => {
    console.log('Database Connected');
    const server = app.listen(8080, () => {
      console.log('Server started');
    });
  })
  .catch((err) => console.log(err));

const clearImage = (filePath) => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, (err) => console.log(err));
};

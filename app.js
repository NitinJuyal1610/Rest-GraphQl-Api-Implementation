const app = require('express')();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const CONNECTION_STRING = '';

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded
app.use(bodyParser.json()); // application/json
app.use('/images', express.static(path.join(__dirname, 'images')));

//image upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images');
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4());
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
//corse setup
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT , PATCH, DELETE, OPTIONS',
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(multer({ storage: storage, fileFilter: fileFilter }).single('image'));

//routes
app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);
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
    app.listen(8080, () => {
      console.log('Server started');
    });
  })
  .catch((err) => console.log(err));

const express = require('express');
const app = express();
const path = require ('node:path');
const morgan = require('morgan');
const indexRouter = require('./routes/indexRouter');
const authRouter = require('./routes/authRouter');
const publicRouter = require('./routes/publicRouter');
require('dotenv').config();
const passport = require("passport");
const expressSession = require("express-session");

const { PrismaPg } = require('@prisma/adapter-pg'); 
const { PrismaClient } = require('./generated/prisma/client');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

app.use(morgan('dev'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const assetsPath = path.join(__dirname, 'public');
app.use(express.static(assetsPath));
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());
app.use(
  expressSession({
    cookie: {
     maxAge: 7 * 24 * 60 * 60 * 1000 // ms
    },
    secret: 'a santa at nasa',
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(
      prisma,
      {
        checkPeriod: 2 * 60 * 1000,  //ms
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: true,
      }
    )
  })
);

app.use('/public', publicRouter);
app.use('/auth', authRouter);
app.use('/folders', indexRouter);
app.use('/', 
  (req, res) => {
    res.redirect('/folders');
  }
);

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).render('err', { status,  msg: err.message });
});

app.use((req, res) => {
  res.status(404).sendFile('/public/404.html', { root: __dirname });
});

const PORT = process.env.NODE_ENV_PORT || 3005;
app.listen(PORT, (error) => {
  if (error) throw error;
  console.log(`The app launched is listening on port ${PORT}!`);
});
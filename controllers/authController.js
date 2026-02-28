const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require("bcryptjs");
const prisma = require('../lib/prisma.js');
const {
  body,
  validationResult,
  matchedData
} = require('express-validator');

const validateUser = [
  body('username')
  .trim()
  .escape()
  .notEmpty().withMessage('Please enter your username.')
  .isLength({ min: 2, max: 30 }).withMessage('Username must be between 2 and 30 characters.')
  .matches(/^[A-Za-z0-9 ]+$/).withMessage('Username can only contain letters and numbers.')
  .custom(async (username) => {
    try {
      const user = await prisma.user.findFirst({ 
        where: { username: username },
      });

      if (user) return Promise.reject('This username is unavailable');
    } catch (error) {
      throw error;
    }
  }),
  body('password')
  .trim()
  .escape()
  .notEmpty().withMessage('Please enter your password.')
  .isLength({ min: 2, max: 10 }).withMessage('Password must be between 2 and 10 characters.'),
  body('confirmPassword')
  .trim()
  .escape()
  .notEmpty().withMessage('Please confirm your password.')
  .custom(
    (confirmPassword, { req: request }) => confirmPassword === request.body.password
  )
  .withMessage('Passwords do not match.'),
];

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await prisma.user.findFirst({ where: { username } });

      if (!user) return done(null, false, { message: "Incorrect username" });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return done(null, false, { message: "Incorrect password" });

      return done(null, user);
    } catch(err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, { id: user.id, username: user.username });
});

passport.deserializeUser(async (user, done) => {
  try {
    const user = await prisma.user.findFirst({ where: { id: user.id } });
    done(null, user);
  } catch(err) {
    done(err);
  }
});

// GET SIGN UP
const getSignUpForm = (req, res) => {
  res.render('signup', {
    title: 'Sign up',
    errors: null
  });
};

// POST SIGN UP
const postSignUpForm = [
  validateUser,
  async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).render('signup', {
        title: 'Sign up',
        errors: errors.array()
      });
    };

    try {
      const { username, password } = matchedData(req);
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          username: username,
          password: hashedPassword,
        },
        include: {
          folders: true,
          files: true
        },
      });

      res.redirect("/folders");
    } catch(err) {
      return next(err);
    };
  }
];

// GET LOG IN
const getLogInForm = (req, res) => {
  let errors = [];
  if (req.query.err === 'expired') {
    errors = [
      {
        msg: 'Link has expired.'
      }
    ];
  } else errors = [];
  res.render('login', {
    title: 'Log In',
    warning: null,
    errors
  });
};

// POST LOG IN 
const postLogInForm = (req, res) => {
  passport.authenticate("local", (err, user, options) => {
    if (user) {
      req.login(user, (error) => {
        error ? res.send(error) : res.redirect('/folders');
      });
    } else {
      res.status(400).render('login', {
        title: 'Log In',
        warning: options.message,
        errors: null
      })
    };
  })(req, res)
};

const getLogOutForm = async (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/auth/login");
  });
};

module.exports = {
  getLogInForm,
  postLogInForm,

  getSignUpForm,
  postSignUpForm,

  getLogOutForm
};
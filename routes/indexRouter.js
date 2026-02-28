const { Router } = require('express');
const indexRouter = Router();
const indexController = require('../controllers/indexController');
const multer = require('multer');
var timeout = require('connect-timeout');

const myAuthenticatedMiddleware = (req, res, next) => {
  console.log('AUTHENTICATION');
  if (req.session.passport && req.session.passport.user) return next();
  res.redirect('/auth/login');
};

const generateName = (originalName) => {
  let rename = originalName;
  for (let i = 0; i < rename.length; i++) {
    if (/\s/g.test(originalName)) rename = rename.replace(" ", "-");
  };
  const num = Math.floor(Math.random() * 100);
  return num + '-' + rename;
};

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/user_files');
  },
  filename: (req, file, cb) => {
    cb(null, generateName(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  console.log('file.mimetype:');
  console.log(file);
  ( file.mimetype === 'image/png' || 
    file.mimetype === 'image/jpg' || 
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/gif' ||
    file.mimetype === 'image/svg+xml' ||
    file.mimetype === 'image/webp' ||
    file.mimetype === 'image/avif' ||
    file.mimetype === 'audio/mpeg' ||
    file.mimetype === 'audio/webm' ||
    file.mimetype === 'text/plain' ||
    file.mimetype === 'text/css' ||
    file.mimetype === 'text/html' ||
    file.mimetype === 'text/javascript' ||
    file.mimetype === 'text/markdown' ||
    file.mimetype === 'text/xml' ||
    file.mimetype === 'font/otf' ||
    file.mimetype === 'font/ttf' ||
    file.mimetype === 'font/woff' ||
    file.mimetype === 'font/woff2' ||
    file.mimetype === 'video/mp4' ||
    file.mimetype === 'video/mpeg' ||
    file.mimetype === 'video/quicktime' ||
    file.mimetype === 'video/webm' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimetype === 'application/vnd.ms-fontobject' ||
    file.mimetype === 'application/gzip' ||
    file.mimetype === 'application/x-gzip' ||
    file.mimetype === 'application/json' ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/x-httpd-php' ||
    file.mimetype === 'application/vnd.ms-powerpoint' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    file.mimetype === 'application/vnd.rar' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'application/xml' ||
    file.mimetype === 'application/zip' ||
    file.mimetype === 'application/x-zip-compressed' ||
    file.mimetype === 'application/octet-stream'
  ) ? cb(null, true) : cb(null, false);  
};

const processingResults = (req, res, err) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading.
    return err;
  } else if (err) {
    // An unknown error occurred when uploading.
    return err;
  } else {
    // Everything went fine.
    return req.file;
  };
};

const uploadMiddleware = multer({ 
  limits: { fieldNameSize: 80, fileSize: 53477376 },
  fileFilter: fileFilter,
  storage: fileStorage, 
}).single('file');

function haltOnTimedout(req, res, next) {
  if (!req.timedout) next();
};

function saveFile (req, res, cb) {
  let result;
  uploadMiddleware(req, res, (err) => {
    result = processingResults(req, res, err);
  });

  setTimeout(function () {
    let err = null;
    if (!result) {
      result = 'Incorrect file format provided.';
    } else if (result.storageErrors && result.storageErrors.length) {
      result = result.storageErrors;
    } else if (result) {
      err = null;
    } else err = result;
    cb(err, result);
  }, 1000);
};

indexRouter.get('/', myAuthenticatedMiddleware, indexController.getHomepage);

indexRouter.post('/:id/new', indexController.postNewFolder);
indexRouter.get('/:id', indexController.getViewFolder);
indexRouter.get('/:id/update', indexController.getUpdate);
indexRouter.post('/:id/update', indexController.postUpdate);
indexRouter.get('/:id/share', indexController.getShare);
indexRouter.post('/:id/share', indexController.postShare);
indexRouter.get('/:id/delete', indexController.getDltFolder); 

indexRouter.get('/:id/files/new', indexController.getNewFile);
indexRouter.post('/:id/files/new', 
  timeout('4s'), 
  haltOnTimedout, 
  function (req, res, next) {
    saveFile(req, res, function (err, result) {
      if (err) return next(err);
      if (req.timedout) {
        err = {
          statusCode: 408,
          message: 'The server timed out waiting for the request.'
        };
        return next(err)
      };
      if (typeof result === 'string') req.err = { msg: result };
      next();
    })
  }, 
  indexController.postNewFile
);

indexRouter.get('/:id/files/:id', indexController.getViewFile);
indexRouter.get('/:id/files/:id/download', indexController.getDltFile);
indexRouter.get('/:id/files/:id/delete', indexController.getDltFile);

module.exports = indexRouter;
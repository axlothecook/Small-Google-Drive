const multer = require('multer');
var timeout = require('connect-timeout');

const generateName = (originalName) => {
  let rename = originalName;
  if (/\s/g.test(originalName)) rename = rename.replace(" ", "-");
  const num = Math.floor(Math.random() * 100);
  return num + '-' + rename;
};

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'user_files');
  },
  filename: (req, file, cb) => {
    cb(null, generateName(file.originalname));
  }
});

const uploadMiddleware = multer({ 
  limits: { fieldNameSize: 80, fileSize: 53477376 },
  fileFilter: fileFilter,
  storage: fileStorage, 
}).single('file');

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
      console.log('SAVE FILE');
      console.log(result);
      console.log(typeof result);
      if (typeof result === 'string') req.err = { msg: result };
      next();
    })
  }, 
  indexController.postNewFile
);

function haltOnTimedout(req, res, next) {
  console.log(req.timedout)
  console.log('this is the first msg');
  if (!req.timedout) next();
};

function saveFile (req, res, cb) {
  let result;
  uploadMiddleware(req, res, (err) => {
    result = processingResults(req, res, err);
  });
  setTimeout(function () {
    console.log('SET TIMEOUT');
    console.log('result:');
    console.log(result);
    let err = null;
    if (!result) {
      result = 'Incorrect file format provided.';
    } else if (result.storageErrors && result.storageErrors.length) {
      result = result.storageErrors;
    } else if (result.code) {
      result = 'File size limit exceeded.';
    } else if (result) {
      err = null;
    } else err = result;

    console.log('still in set ttimeout:');
    console.log(err);
    cb(err, result);
  }, 1000);
};
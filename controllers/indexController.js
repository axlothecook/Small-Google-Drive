const prisma = require('../lib/prisma.js');
const { format, addHours } = require('date-fns');
const {
  body,
  validationResult,
  matchedData
} = require('express-validator');
var fs = require('fs');

const validateRename = [
  body('name')
  .trim()
  .escape()
  .isLength({ min: 2, max: 50 }).withMessage(`Folder name must be between 2 and 50 letters.`)
  .matches(/^[A-Za-z0-9 ]+$/).withMessage('Folder name can only contain letters and numbers.'),
];

// additional neccessary functions
const deleteChildFolders = async (arrayOfChildFolders) => {

  // repeat for all children folders of folder we wanna delete
  arrayOfChildFolders.map(async(folder) => {
    // log the child folder, along with its subfolders and files
    let childFolder = await prisma.folder.findUnique({ 
      where: { id: folder.id },
      include: { childrenFolders: true, files: true, }
    });

    // if child folder has subfolders on itws own, repeat process
    if (childFolder.childrenFolders.length) await deleteChildFolders(childFolder.childrenFolders);

    // if child folder has files, delete them
    if (childFolder.files.length) {
      const files = childFolder.files;
      files.map(async(file) => {
        await dltFileFunction(file, file.id);
      });
    };

    // finally delete the child folder and return to previous function call
    await prisma.folder.delete({ where: { id: childFolder.id } });
  });
  return;
};

const getCrumbs = async (folder) => {
  let temp = folder;
  let crumbsPath = [
    {
      id: temp.id,
      name: temp.title
    }
  ];

  while (temp.parentFolderId) {
    temp = await prisma.folder.findUnique({ where: { id: temp.parentFolderId } });
    crumbsPath.unshift({
      id: temp.id,
      name: temp.title
    });
  };

  return crumbsPath;
};

const timeStampFolderCreation = () => {
  return format(new Date(), 'MMMM dd, yyyy');
};

const timeStampFileCreation = () => {
  return format(new Date(), 'MMMM dd, yyyy, hh:mm a');
};

const dltFileFunction = async (file, id) => {
  let assetsPath;
  try {
    if(__dirname.includes('controllers')) {
      const index = __dirname.indexOf('controllers');
      assetsPath = `${__dirname.substring(0, index)}public\\user_files\\${file.newFileName}`;
    };
    fs.unlink(assetsPath, function (err) {
      if (err) console.error(`Error while unlinking a file. ${err}`);
    });
    await prisma.file.delete({ where: { id: parseInt(id) } });
  } catch (err) {
    return err;
  };
};

// actual middleware
const getHomepage = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.passport.user.id },
      include: {
        folders: {
          where: {
            parentFolderId: null,
          }
        },
        files: {
          where: {
            folderId: null
          }
        },
      },
    });

    res.render('index', {
      title: 'Home | Personal Storage',
      username: user.username,
      folders: user.folders,
      files: user.files,
      crumbsPath: [],
      id: 0
    });
  } catch (err) {
    throw new Error(`Error when loading homepage. ${err}`);
  };
};

const postNewFolder = async (req, res) => {
  try {
    if (req.params.id > 0) { 
      await prisma.folder.update({
        where: { id: parseInt(req.params.id) },
        data: { 
          childrenFolders: {
            create: [{
              added: timeStampFolderCreation(),
              authorId: req.session.passport.user.id,
            }]
          }
        },
        include: { 
          childrenFolders: true,
          files: true,
        },
      });

      res.redirect(`/folders/${req.params.id}`);
    } else {
      await prisma.folder.create({
        data: {
          added: timeStampFolderCreation(),
          authorId: req.session.passport.user.id,
        }
      });
      res.redirect('/folders');
    };
  } catch (err) {
    throw new Error(`Ooopsie! Error when creating a folder! ${err}`);
  };
};

const getViewFolder = async (req, res) => {
  try {
    if (req.params.id != 0) {
      const folder = await prisma.folder.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { 
          childrenFolders: true,
          files: true,
        },
      });

      const crumbsPath = await getCrumbs(folder);
      res.render('index', {
        title: `${folder.title} | Personal Storage`,
        username: req.session.passport.user.username,
        folders: folder.childrenFolders,
        files: folder.files,
        crumbsPath,
        id: folder.id,
        parentFolderId: folder.parentFolderId,
      });
    } else res.redirect('/folders');
  } catch (err) {
    throw new Error(`Error occured when loading folder data. ${err}`);
  };
};

const getUpdate = async (req, res) => {
  const folder = await prisma.folder.findUnique({ where: { id: parseInt(req.params.id) } });
  try {
    res.render('folder-related/edit', {
      title: 'Edit folder | Personal Storage',
      id: req.params.id,
      parentFolderId: folder.parentFolderId,
      errors: null
    });
  } catch (err) {
    throw new Error(`Error occured when displaying folder name to update. ${err}`);
  };
};

const postUpdate = [
  validateRename,
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      const folder = await prisma.folder.findUnique({ where: { id: parseInt(req.params.id) } });
      return res.render('folder-related/edit', {
        title: 'Edit folder | Personal Storage',
        id: req.params.id,
        parentFolderId: folder.parentFolderId, 
        errors: errors.array()
      });
    };

    try {
      const { name } = matchedData(req);
      const folder = await prisma.folder.update({
        where: { id: parseInt(req.params.id) },
        data: { title: name },
      });

      folder.parentFolderId ? res.redirect(`/folders/${folder.parentFolderId}`) : res.redirect("/folders");
    } catch (err) {
      return next(err);
    };
  }
];

const getDltFolder = async (req, res) => {
  try {
    const folderToDlt = await prisma.folder.findUnique({ 
      where: { id: parseInt(req.params.id) },
      include: {childrenFolders: true, files: true, }
    });

    if (folderToDlt.childrenFolders.length) await deleteChildFolders(folderToDlt.childrenFolders);
    if (folderToDlt.files) folderToDlt.files.map(async(childFile) => await dltFileFunction(childFile, childFile.id));

    const id = folderToDlt.parentFolderId;
    await prisma.folder.delete({ where: { id: parseInt(req.params.id) } });
    setTimeout(() => {
      id ? res.redirect(`/folders/${id}`) : res.redirect("/folders");
    }, 1000);

  } catch (err) {
    throw new Error(`Error when deleting a folder. ${err}`);
  };
};

const getNewFile = (req, res) => {
  try {
    res.render('file-related/new', {
      title: 'New file | Personal Storage',
      parentFolderId: req.params.id ? req.params.id : 0,
      errors: null
    });
  } catch (err) {
    throw new Error(`Error occured when loading page to add new file. ${err}`);
  };
};

const postNewFile = async (req, res) => {
  try {
    if (req.err) {
      return res.status(400).render('file-related/new', {
        title: 'New file | Personal Storage',
        id: req.params.id,
        parentFolderId: req.params.id ? req.params.id : 0,
        errors: [
          {
            msg: req.err.msg
          }
        ]
      });
    };

    let fileSize;
    if (req.file.size <= 1048576) {
      (req.file.size <= 1024) ? fileSize = `${req.file.size} B` : fileSize = `${(req.file.size / 1024).toFixed(2)} KB`;
    } else fileSize = `${(req.file.size / 1048576).toFixed(2)} MB`;
    if (req.params.id > 0) {
      await prisma.file.create({
        data: {
          originalName: req.file.originalname,
          type: req.file.mimetype,
          size: fileSize,
          newFileName: req.file.filename,
          added: timeStampFileCreation(),
          authorId: req.session.passport.user.id,
          folderId: parseInt(req.params.id),
        }
      });

      await prisma.folder.update({
        where: { id: parseInt(req.params.id) },
        data: { numberOfFiles: { increment: 1 } },
      });
      
      res.redirect(`/folders/${req.params.id}`);

    } else {
      let results = await prisma.file.create({
        data: {
          originalName: req.file.originalname,
          type: req.file.mimetype,
          size: fileSize,
          newFileName: req.file.filename,
          added: timeStampFileCreation(),
          authorId: req.session.passport.user.id,
        }
      });
      res.redirect('/folders');
    };
  } catch (err) {
    throw new Error(`Oopsie! Error occured while uploading a file. ${err}`);
  };
};

const getViewFile = async (req, res) => {
  try {
    const file = await prisma.file.findUnique({ where: { id: parseInt(req.params.id) } });
    res.render('file-related/view', {
      title: `${file.originalName} | Personal Storage`,
      file,
      isPublic: false,
      linkRoute: `folders`,
      imgURL: file.type.includes('image') ? `url(/user_files/${file.newFileName})` : null,
      generalURL: `/user_files/${file.newFileName}`,
      folderId: file.folderId ? file.folderId : 0
    });
  } catch (err) {
    throw new Error(`Error occured when loading file data. ${err}`);
  };
};

const getDltFile = async (req, res) => {
  try {
    const fileToDlt = await prisma.file.findUnique({ where: { id: parseInt(req.params.id) } });
    if (fileToDlt.folderId) {
      await prisma.folder.update({
        where: { id: fileToDlt.folderId },
        data: { numberOfFiles: { decrement: 1 } },
      });
    };

    const id = fileToDlt.folderId;
    await dltFileFunction(fileToDlt, req.params.id);
    id ? res.redirect(`/folders/${id}`) : res.redirect("/folders");

  } catch (err) {
    throw new Error(`Error when deleting a file. ${err}`);
  };
};

const getShare = async (req, res) => {
  const folder = await prisma.folder.findUnique({ where: { id: parseInt(req.params.id) } });
  try {
    res.render('folder-related/share', {
      title: 'Share folder | Personal Storage',
      folderName: folder.title,
      id: req.params.id,
      parentFolderId: folder.parentFolderId,
    });
  } catch (err) {
    throw new Error(`Error occured when getting the share page. ${err}`);
  };
};

const postShare = async (req, res) => {
  try {
    const folder = await prisma.folder.findUnique({ where: { id: parseInt(req.params.id) } });
    const result = JSON.stringify({
      folderId: folder.id,
      expiresAt: addHours(new Date(), parseInt(req.body.duration))
    });
    
    const buffer = Buffer.from(result, 'utf-8');
    const encodedString = buffer.toString('base64');
    var hostname = req.headers.host; 
    const link = `http://${hostname}/public/${encodedString}`;

    res.render('folder-related/generated-link', {
      title: 'Share folder | Personal Storage',
      folderName: folder.title,
      id: req.params.id,
      parentFolderId: folder.parentFolderId,
      link
    });
  } catch (err) {
    throw new Error(`Error occured when generating link. ${err}`);
  };
};

module.exports = {
  getHomepage,

  postNewFolder,

  getViewFolder,

  getUpdate,
  postUpdate,

  getDltFolder,

  getNewFile,
  postNewFile,

  getViewFile,

  getDltFile,

  getShare,
  postShare
};
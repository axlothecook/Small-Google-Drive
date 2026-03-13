const prisma = require('../lib/prisma.js');
const { format, addHours } = require('date-fns');
const {
  body,
  validationResult,
  matchedData
} = require('express-validator');
const supabase = require('../supabase');
const { decode }  = require('base64-arraybuffer');

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
        const bucket = getBucket(file.type);
        await dltFileFunction(file.id, file.newName, bucket);
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

const generateName = (originalName) => {
  let rename = originalName;
  if (/\s/g.test(originalName)) rename = rename.replace(" ", "-");
  const num = Math.floor(Math.random() * 100);
  return num + '-' + rename;
};

const getBucket = (type) => {
 if (type.includes('image')) {
  return 'storage-images';
 } else if (type.includes('video')) {
  return 'storage-videos';
 } else if (type.includes('audio')) {
  return 'storage-audio';
 } else if (type.includes('text')) {
  return 'storage-text';
 } else if (type.includes('font')) {
  return 'storage-font';
 } else return 'storage-application';
};

const dltFileFunction = async (id, name, bucket) => {
  try {
    const { data, error } = await supabase
    .storage
    .from(bucket)
    .remove([name])
    
    if (error != null) throw error;

    await prisma.file.delete({ where: { id: id } });
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
    if (folderToDlt.files) {
      folderToDlt.files.map(async(childFile) => {
        const bucket = getBucket(childFile.type);
        await dltFileFunction(childFile.id, childFile.newName, bucket);
      });
    };

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

    const file = req.file;
    const fileBase64 = decode(file.buffer.toString('base64'));
    const newName = generateName(file.originalname);
    const bucket = getBucket(file.mimetype);
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(newName, fileBase64, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (error != null) throw error;

    const { data: obj } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    let fileSize;
    if (req.file.size <= 1048576) {
      (req.file.size <= 1024) ? fileSize = `${req.file.size} B` : fileSize = `${(req.file.size / 1024).toFixed(2)} KB`;
    } else fileSize = `${(req.file.size / 1048576).toFixed(2)} MB`;

    if (req.params.id > 0) {
      const newFile = await prisma.file.create({
        data: {
          originalName: file.originalname,
          newName: newName,
          type: file.mimetype,
          size: fileSize,
          url: obj.publicUrl,
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
      const newFile = await prisma.file.create({
        data: {
          originalName: file.originalname,
          newName: newName,
          type: file.mimetype,
          size: fileSize,
          url: obj.publicUrl,
          added: timeStampFileCreation(),
          authorId: req.session.passport.user.id,
        }
      });

      res.redirect('/folders');
    };
  } catch (err) {
    throw new Error(`Oopsie! Error occured while uploading a file.`, err);
  };
};

const getViewFile = async (req, res) => {
  try {
    const file = await prisma.file.findUnique({ where: { id: parseInt(req.params.id) } });

    res.render('file-related/view', {
      title: `${file.originalName} | Personal Storage`,
      file,
      imgPath: file.type.includes('image') ? `url(${file.url})` : null,
      isPublic: false,
      linkRoute: `folders`,
      folderId: file.folderId ? file.folderId : 0
    });
  } catch (err) {
    throw new Error(`Error occured when loading file data. ${err}`);
  };
};

const getDltFile = async (req, res) => {
  try {
    const file = await prisma.file.findUnique({ where: { id: parseInt(req.params.id) } });
    if (file.folderId) {
      await prisma.folder.update({
        where: { id: file.folderId },
        data: { numberOfFiles: { decrement: 1 } },
      });
    };

    const id = file.folderId;
    await dltFileFunction(file.id, file.newName, getBucket(file.type));
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
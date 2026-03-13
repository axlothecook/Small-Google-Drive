const prisma = require('../lib/prisma.js');

let originalSharedFolder;

const getCrumbs = async (folder) => {
  if (folder.id === originalSharedFolder.id) return [];
  let temp = folder;
  let crumbsPath = [
    {
      id: temp.id,
      name: temp.title
    }
  ];

  while (temp.parentFolderId) {
    temp = await prisma.folder.findUnique({ where: { id: temp.parentFolderId } });
    if (temp.id == originalSharedFolder.id) break;
    crumbsPath.unshift({
        id: temp.id,
        name: temp.title
    });
  };

  return crumbsPath;
};

const getFolderInfo = async (req, res) => {
    try {
        const folder = await prisma.folder.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { 
                childrenFolders: true,
                files: true,
            },
        });

        if (typeof req.params.id === 'number') originalSharedFolder = { id: folder.id, title: folder.title };
        const crumbsPath = await getCrumbs(folder);

        res.render('public', {
            title: `${folder.title} | Personal Storage`,
            username: originalSharedFolder.title,
            linkRoute: `public/${req.params.link}`,
            folders: folder.childrenFolders,
            files: folder.files,
            crumbsPath,
            id: folder.id,
            parentFolderId: folder.parentFolderId,
        });

    } catch (err) {
        throw new Error(`Error occured when loading public folder data. ${err}`);
    };
};

const getFile = async (req, res) => {
    try {
        const file = await prisma.file.findUnique({ where: { id: parseInt(req.params.id) } });
        res.render('file-related/view', {
            title: `${file.originalName} | Personal Storage`,
            file,
            linkRoute: `public/${req.params.link}`,
            isPublic: true,
            imgPath: file.type.includes('image') ? `url(${file.url})` : null,
            folderId: file.folderId
        });

    } catch (err) {
        throw new Error(`Error occured when loading public file data. ${err}`);
    };
};

module.exports = { 
    getFolderInfo,
    getFile
};
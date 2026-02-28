const { Router } = require('express');
const publicRouter = Router();
const publicController = require('../controllers/publicController');
const { isAfter } = require('date-fns');

const dateCheckMiddleware = (req, res, next) => {
    const decodedBuffer = Buffer.from(req.params.link, 'base64');
    const decodedString = decodedBuffer.toString('utf-8');
    const obj = JSON.parse(decodedString);
    // console.log('GETTING FOREIGN USER AUTH');
    // console.log(obj);
    if (isAfter(obj.expiresAt, new Date())) {
        console.log('NOT EXPIRED');
        // console.log(req.session);
        req.params.id = obj.folderId;
        next();
    } else {
        console.log('EXPIRED');
        return res.redirect('/auth/login?err=expired');
    };
};

publicRouter.get('/:link', dateCheckMiddleware, publicController.getFolderInfo);
publicRouter.get('/:link/:id', publicController.getFolderInfo);
publicRouter.get('/:link/:id/files/:id', publicController.getFile);

module.exports = publicRouter;
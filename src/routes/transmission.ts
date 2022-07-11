import express from 'express';

import { chunkUploader, isFileExist, mergeChunks, removeFile, upload, uploader } from '../controller/transmission';

const router = express.Router();


router.get('/is-file-exist', isFileExist);

router.post('/upload', uploader.any(), upload);

router.post('/upload-chunk', chunkUploader.any(), function(req, res) {
  res.sendStatus(200);
});

router.post('/merge-chunks', mergeChunks);

router.get('/remove', removeFile);

export default {
  router,
  path: '/api/transmission',
};

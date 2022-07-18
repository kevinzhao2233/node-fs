import express from 'express';

import { chunkUploader, createTransmission,
  findTransmissionDetail, isFileExist, mergeChunks, removeFile, upload, uploader } from '../controller/transmission';

const router = express.Router();


router.get('/is-file-exist', isFileExist);

router.post('/upload', uploader.any(), upload);

router.post('/upload-chunk', chunkUploader.any(), function(req, res) {
  res.sendStatus(200);
});

router.post('/merge-chunks', mergeChunks);

router.get('/remove', removeFile);

router.post('/transmission', createTransmission);

router.get('/transmission/:id', findTransmissionDetail);

export default {
  router,
  path: '/api',
};

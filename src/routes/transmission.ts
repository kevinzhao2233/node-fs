import express from 'express';

import { isFileExist } from '../controller/transmission';

const transmissionRouter = express.Router();

transmissionRouter.get('/is-file-exist', isFileExist);

export default {
  router: transmissionRouter,
  path: '/api/transmission',
};

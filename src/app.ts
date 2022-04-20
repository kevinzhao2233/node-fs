// 第三方模块
import express from 'express';
import chalk from 'chalk';
import multer from 'multer';
import cors from 'cors';
import { urlencoded, json } from 'body-parser';
import { NextFunction, Request, Response } from 'express';
import { systemConfig } from './config';
import path from 'path';

const uploadPath = path.join(__dirname, '../upload');
const uploadTempPath = path.join(uploadPath, 'temp');

// 用于记录启动时间的日志
const startTime = Date.now();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadPath);
  },
  filename(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const uploader = multer({
  storage: storage,
});

const chunkStorage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, uploadTempPath)
  },
  filename(req, file, callback) {
    setImmediate(() => {
      callback(null, `${req.body.fileMd5}-${req.body.chunkIndex}`)
    });
  }
});

const chunkUploader = multer({
  storage: chunkStorage,
});

const app = express();

// 允许跨域
app.use(cors());

// 处理 post 请求
app.use(urlencoded({ extended: true }));
app.use(json());

// 错误处理
app.use(function(err: Error, req: Request, res: Response, next: NextFunction) {
  return res.sendStatus(500);
});

// 接口
app.get('/', function(req, res) {
  res.send('欢迎使用 node-fs');
});

app.post('/upload', uploader.any(), function(req, res) {
  console.log('\n\n\n------ req.body -------->>\n', req.body);
  res.sendStatus(200);
});

app.post('/upload-chunk', chunkUploader.single('file'), function(req, res) {
  res.sendStatus(200);
});

app.get('/download/:filename', (req, res) => {
  // const path = __dirname + '../download/' + req.params.filename;
  const filepath = path.resolve(__dirname, '../download/', req.params.filename);
  console.log({ path, dirname: __dirname, filename: req.params.filename });
  res.sendFile(filepath, (err) => {
    if (!err) {
      console.log('\n\n>>>>>>--- 发送成功 ---<<<<<<\n\n');
      return;
    }
    console.dir(err);
  });
});

// 监听服务
app.listen(systemConfig.port, function() {
  console.log(
      chalk.cyan('\n  the server is start at:\n'),
      '\n  > Local', chalk.green(`http://localhost:${systemConfig.port}\n`),
      chalk.cyan(`\n  ready in ${Date.now() - startTime}ms\n`),
  );
});

export default app;

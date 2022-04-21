// 第三方模块
import express, { NextFunction, Request, Response } from 'express';
import chalk from 'chalk';
import multer from 'multer';
import cors from 'cors';
import { urlencoded, json } from 'body-parser';
import { systemConfig } from './config';
import path from 'path';
import fse from 'fs-extra';
import { mkdirsSync } from './utils/dir';
// 用于记录启动时间的日志
const startTime = Date.now();

const uploadPath = path.join(__dirname, '../upload');
const uploadTempPath = path.join(uploadPath, 'temp');

const app = express();

// 允许跨域
app.use(cors());

// 处理 post 请求
app.use(urlencoded({ extended: true }));
app.use(json());

// 创建上传用的文件夹
app.use(function(req, res, next) {
  mkdirsSync(uploadPath);
  mkdirsSync(uploadTempPath);
  next();
});

// 错误处理
app.use(function(err: Error, req: Request, res: Response, next: NextFunction) {
  return res.sendStatus(500);
});

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
    setImmediate(() => {
      const fileChunksPath = path.join(uploadTempPath, `${req.body.fileName}-${req.body.fileMd5}`);
      mkdirsSync(path.join(uploadTempPath, `${req.body.fileName}-${req.body.fileMd5}`));
      callback(null, fileChunksPath);
    });
  },
  filename(req, file, callback) {
    setImmediate(() => {
      callback(null, `${req.body.fileName}-${req.body.fileMd5}-${req.body.chunkIndex}`);
    });
  },
});

const chunkUploader = multer({
  storage: chunkStorage,
});

const mergeChunks = (req: Request, res: Response) => {
  const fileName: string = req.body.fileName;
  const md5: string = req.body.md5;
  const chunkTotal: number = req.body.chunkTotal;

  const fileChunksPath = path.join(uploadTempPath, `${req.body.fileName}-${req.body.md5}`);
  const chunks = fse.readdirSync(fileChunksPath);
  const fileTargetPath = path.join(uploadPath, fileName);

  fse.writeFile(fileTargetPath, '', (err) => {
    if (err) {
      res.sendStatus(500);
      return;
    }
    if (chunks.length !== chunkTotal || chunks.length === 0) {
      res.sendStatus(200);
      res.end('切片文件数量不符合');
      return;
    }
    for (let i = 0; i < chunkTotal; i+=1) {
      // 追加写入到文件中
      const data = fse.readFileSync(path.join(fileChunksPath, `${fileName}-${md5}-${i}`));
      fse.appendFileSync(fileTargetPath, data);
      // // 删除本次使用的chunk
      fse.unlink(path.join(fileChunksPath, `${fileName}-${md5}-${i}`));
    }
    fse.rmdir(fileChunksPath);
    res.sendStatus(200);
  });
};

const downloadFile = (req: Request, res: Response) => {
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
};

// 接口
app.get('/', function(req, res) {
  res.send('欢迎使用 node-fs');
});

app.post('/upload', uploader.any(), function(req, res) {
  res.sendStatus(200);
});

app.post('/upload-chunk', chunkUploader.any(), function(req, res) {
  res.sendStatus(200);
});

app.post('/merge-chunks', mergeChunks);

app.get('/download/:filename', downloadFile);

// 监听服务
app.listen(systemConfig.port, function() {
  console.log(
      chalk.cyan('\n  the server is start at:\n'),
      '\n  > Local', chalk.green(`http://localhost:${systemConfig.port}\n`),
      chalk.cyan(`\n  ready in ${Date.now() - startTime}ms\n`),
  );
});

export default app;

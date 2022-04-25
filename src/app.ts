// 第三方模块
import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import fse from 'fs-extra';
import chalk from 'chalk';
import multer from 'multer';
import cors from 'cors';
import mysql from 'mysql2';
import { nanoid } from 'nanoid';
// 使用 import 导入会报错 getExtension undefined
const mime = require('mime');

import { devServerPort } from './config/appConfig';
import { mysqlConfig } from './config/dbConfig';
import { mkdirsSync } from './utils/dir';

const connection = mysql.createConnection(mysqlConfig);

// 用于记录启动时间的日志
const startTime = Date.now();

const uploadPath = path.join(__dirname, '../upload');
const uploadTempPath = path.join(uploadPath, 'temp');

const app = express();

// 允许跨域
app.use(cors());

// 处理 post 请求
app.use(express.json());

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
    const fileId = nanoid(16);
    const fileName = `${file.originalname}-${fileId}`;
    req.body.postFileName = fileName;
    req.body.fileId = fileId;
    req.body.mimeType = file.mimetype;
    cb(null, fileName);
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
      res.sendStatus(400);
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
  const insertSql = 'INSERT INTO files SET ?';
  const values = {
    id: req.body.fileId,
    name: req.body.fileName,
    ext: mime.getExtension(req.body.mimeType),
    state: 'normal',
    mime: req.body.mimeType,
    md5: req.body.fileMd5,
    path: path.join(uploadPath, req.body.postFileName),
    size: req.body.fileSize,
    upload_time: new Date(),
  };

  connection.query(insertSql,
      values,
      (err, results, fields) => {
        if (err) {
          res.status(500).send('保存到数据库时出错了');
        }
        res.status(200).send('文件已上传完毕');
      });
});

app.post('/upload-chunk', chunkUploader.any(), function(req, res) {
  res.sendStatus(200);
});

app.post('/merge-chunks', mergeChunks);

app.get('/download/:filename', downloadFile);

// 监听服务
app.listen(devServerPort, function() {
  console.log(
      chalk.cyan('\n  the server is start at:\n'),
      '\n  > Local', chalk.green(`http://localhost:${devServerPort}\n`),
      chalk.cyan(`\n  ready in ${Date.now() - startTime}ms\n`),
  );
});

export default app;

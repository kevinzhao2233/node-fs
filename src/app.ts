import chalk from 'chalk';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import fse from 'fs-extra';
import multer from 'multer';
import mysql, { ResultSetHeader, RowDataPacket } from 'mysql2';
import { nanoid } from 'nanoid';
import path from 'path';
// 使用 import 导入会报错 getExtension undefined
const mime = require('mime');

import { devServerPort } from './config/appConfig';
import { mysqlConfig } from './config/dbConfig';
import transmission from './routes/transmission';
import { mkdirsSync } from './utils/dir';

const connection = mysql.createConnection(mysqlConfig);

// 用于记录启动时间的日志
const startTime = Date.now();

const uploadPath = path.join(__dirname, '../upload');
const uploadTempPath = path.join(uploadPath, 'temp');

const app = express();

// 允许跨域
app.use(cors());

// 处理 get 请求参数
app.use(express.urlencoded());

// 处理 post 请求
app.use(express.json());

// 创建上传用的文件夹
app.use(function(req, res, next) {
  mkdirsSync(uploadPath);
  mkdirsSync(uploadTempPath);
  next();
});

// 错误处理
app.use(function(err: Error, req: Request, res: Response) {
  return res.sendStatus(500);
});

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadPath);
  },
  filename(req, file, cb) {
    const fileId = nanoid(16);
    const fileName = `${fileId}-${file.originalname}`;
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

const isFileExist = (req: Request, res: Response) => {
  const { id, md5 } = req.query;
  connection.query(
    'SELECT * FROM files WHERE id = ? OR md5 = ?',
    [id, md5],
    (err, results: RowDataPacket[], fields) => {
      if (err) {
        res.status(500).send('查询数据库时出错了');
        return;
      }
      if (results.length) {
        res.send({
          isExist: true,
          file: results[0],
        });
      } else {
        res.send({
          isExist: false,
        });
      }
    });
};

const upload = (req: Request, res: Response) => {
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

  connection.query(
    'INSERT INTO files SET ?',
    values,
    (err, results, fields) => {
      if (err) {
        res.status(500).send('保存到数据库时出错了');
      }
      res.status(200).send('文件已上传完毕');
    });
};

const mergeChunks = (req: Request, res: Response) => {
  const fileId = nanoid(16);
  const fileName: string = req.body.fileName;
  const postFileName = `${fileId}-${fileName}`;
  const md5: string = req.body.md5;
  const chunkTotal: number = req.body.chunkTotal;

  const fileChunksPath = path.join(uploadTempPath, `${req.body.fileName}-${req.body.md5}`);
  const chunks = fse.readdirSync(fileChunksPath);
  const fileTargetPath = path.join(uploadPath, postFileName);

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
      // 删除本次使用的chunk
      fse.unlink(path.join(fileChunksPath, `${fileName}-${md5}-${i}`));
    }
    fse.rmdir(fileChunksPath);

    const fileMimeType = mime.getType(fileName);
    const values = {
      id: fileId,
      name: fileName,
      ext: mime.getExtension(fileMimeType),
      state: 'normal',
      mime: fileMimeType,
      md5,
      path: fileTargetPath,
      size: fs.statSync(fileTargetPath).size,
      upload_time: new Date(),
    };
    connection.query(
      'INSERT INTO files SET ?',
      values,
      (err, results, fields) => {
        if (err) {
          res.status(500).send('保存到数据库时出错了');
        }
        res.status(200).send('文件已上传完毕');
      });
  });
};

const removeFile = (req: Request, res: Response) => {
  const { id, md5 } = req.query;
  connection.query(
    'UPDATE files SET state = "removed" WHERE id = ? OR md5 = ?',
    [id, md5],
    (err, result: ResultSetHeader, fields) => {
      if (err) {
        res.status(500).send('更新数据库时出错了');
        return;
      }
      if (result && result.changedRows && result.changedRows >= 1) {
        res.send({
          isRemoved: true,
        });
      } else {
        res.send({
          isRemoved: false,
          msg: '该文件不存在或已被删除',
        });
      }
    });
};

const downloadFile = (req: Request, res: Response) => {
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

app.use(transmission.path, transmission.router);

// 接口
app.get('/', function(req, res) {
  res.redirect('http://localhost:10002/');
});

app.get('/is-file-exist', isFileExist);

app.post('/upload', uploader.any(), upload);

app.post('/upload-chunk', chunkUploader.any(), function(req, res) {
  res.sendStatus(200);
});

app.post('/merge-chunks', mergeChunks);

app.get('/remove', removeFile);

app.get('/download/:filename', downloadFile);

// 监听服务
app.listen(devServerPort, function() {
  console.log(
    chalk.cyan('\n  the api server is start at:\n'),
    '\n  > Local', chalk.green(`http://localhost:${devServerPort}\n`),
    chalk.cyan(`\n  ready in ${Date.now() - startTime}ms\n`),
  );
});

export default app;

import dayjs from 'dayjs';
import { Request, Response } from 'express';
import fse from 'fs-extra';
import multer from 'multer';
import { nanoid } from 'nanoid';
import fs from 'node:fs';
import path from 'node:path';

import { createFile, findFileByMD5, removeFileById } from '../models/file';
import { createTrans, findTransById } from '../models/transmission';
import { mkdirsSync } from '../utils/dir';

const mime = require('mime');

const uploadPath = path.join(__dirname, '../../upload/');
const uploadTempPath = path.join(uploadPath, 'temp');

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

export const uploader = multer({
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

export const chunkUploader = multer({
  storage: chunkStorage,
});


export const isFileExist = async (req: Request, res: Response) => {
  const { md5 } = req.query;
  if (!md5) {
    res.status(400).send({ msg: '需要文件 md5 值作为请求参数' });
  }
  try {
    const { file } = await findFileByMD5(md5 as string);
    res.send({
      isExist: !!file,
      file,
    });
  } catch (error) {
    res.status(500).send({ msg: 'isFileExist 获取数据错误' });
  }
};

export const upload = async (req: Request, res: Response) => {
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

  try {
    await createFile(values);
    res.status(200).send('文件已上传完毕');
  } catch (error) {
    res.status(500).send({ msg: 'upload 文件信息保存到数据库时出错' });
  }
};

export const mergeChunks = (req: Request, res: Response) => {
  const fileId = nanoid(16);
  const fileName: string = req.body.fileName;
  const postFileName = `${fileId}-${fileName}`;
  const md5: string = req.body.md5;
  const chunkTotal: number = req.body.chunkTotal;

  const fileChunksPath = path.join(uploadTempPath, `${req.body.fileName}-${req.body.md5}`);
  const chunks = fse.readdirSync(fileChunksPath);
  const fileTargetPath = path.join(uploadPath, postFileName);

  fse.writeFile(fileTargetPath, '', async (err) => {
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

    try {
      await createFile(values);
      res.status(200).send('文件已上传完毕');
    } catch (error) {
      res.status(500).send({ msg: 'upload 文件信息保存到数据库时出错' });
    }
  });
};

export const removeFile = async (req: Request, res: Response) => {
  const { id } = req.query;
  try {
    const { isRemoved } = await removeFileById(id as string);
    res.status(200).send({
      isRemoved,
      msg: isRemoved ? '文件删除成功' : '该文件不存在或已被删除',
    });
  } catch (error) {
    res.status(500).send({ msg: 'removeFile 文件信息删除失败' });
  }
};

export const createTransmission = async (req: Request, res: Response) => {
  const { uid, description, expiration, needPassword } = req.body;
  const id = nanoid(32);
  const values = {
    id,
    uid,
    description,
    expiration: dayjs(expiration).format('YYYY-MM-DD HH:DD:MM'),
    need_password: needPassword,
    password: needPassword ? Math.random().toString().substring(2, 8): null,
    share_link: `http://localhost:10001/receive/${id}`,
  };
  try {
    const { success } = await createTrans(values);
    if (!success) {
      res.status(500).send({ msg: 'createTrans 创建传输失败' });
      return;
    }
    const { transmission } = await findTransById(id);
    res.status(200).send(transmission);
  } catch (error) {
    res.status(500).send({ msg: 'createTrans 创建传输失败' });
  }
};

export const findTransmissionDetail = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { transmission } = await findTransById(id);
  res.status(200).send(transmission);
};

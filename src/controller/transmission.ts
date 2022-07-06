import { Request, Response } from 'express';

import { findByMD5 } from '../models/transmission';

export const isFileExist = async (req: Request, res: Response) => {
  const { md5 } = req.query;
  if (!md5) {
    res.status(400).send({ msg: '需要文件 md5 值作为请求参数' });
  }
  try {
    const { file } = await findByMD5(md5 as string);
    res.send({
      isExist: !!file,
      file,
    });
  } catch (error) {
    res.status(500).send({ msg: 'isFileExist 获取数据错误' });
  }
};

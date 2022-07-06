import { Request, Response } from 'express';
import { findByMD5 } from '../models/transmission';

export const isFileExist = async (req: Request, res: Response) => {
  const result =  await findByMD5('sdf765s7f')
  res.send(result)
};

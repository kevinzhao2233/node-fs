import { FieldPacket, RowDataPacket } from 'mysql2/promise';

import { conn } from './db';

export interface FileModel {
  id: string;
  name: string;
  ext: string;
  state: string;
  mime: string;
  md5: string;
  path: string;
  size: number;
  upload_time: Date;
}

export const findByID = async (id: string) => {
  const [results, fields]: [RowDataPacket[], FieldPacket[]] = await conn.query(`SELECT * FROM files WHERE id = '${id}'`);
  return {
    file: results[0],
  };
};

export const findByMD5 = async (md5: string) => {
  const [results, fields]: [RowDataPacket[], FieldPacket[]] = await conn.query(`SELECT * FROM files WHERE md5 = '${md5}'`);
  return {
    file: results[0],
  };
};

export const create = async (values: FileModel) => {
  const [results, fields]: [RowDataPacket[], FieldPacket[]] = await conn.query('INSERT INTO files SET ?', values);
  return {
    results,
    fields,
  };
};

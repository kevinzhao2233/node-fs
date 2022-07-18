import { FieldPacket, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

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
  create_at?: Date;
}

export const findFileByID = async (id: string) => {
  const [results, fields]: [RowDataPacket[], FieldPacket[]] = await conn.query(`SELECT * FROM file WHERE id = '${id}'`);
  return {
    file: results[0],
  };
};

export const findFileByMD5 = async (md5: string) => {
  const [results, fields]: [RowDataPacket[], FieldPacket[]] = await conn.query(`SELECT * FROM file WHERE md5 = '${md5}'`);
  return {
    file: results[0],
  };
};

export const createFile = async (values: FileModel) => {
  const [results, fields]: [RowDataPacket[], FieldPacket[]] = await conn.query('INSERT INTO file SET ?', values);
  console.log({ results, fields });
  return {
    results,
    fields,
  };
};

export const removeFileById = async (id: string) => {
  const [results, fields]: [ResultSetHeader, FieldPacket[]] = await conn.query(`UPDATE file SET state = "removed" WHERE id = '${id}'`);
  console.log('removeById', { results, fields });
  return ({
    isRemoved: !!(results && results.changedRows && results.changedRows >= 1),
  });
};

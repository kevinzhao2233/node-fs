import { FieldPacket, RowDataPacket } from 'mysql2/promise';
import { conn } from './db';

export const findByMD5 = async (md5: string) => {
  const [results, fields]: [RowDataPacket[], FieldPacket[]] = await conn.query(`SELECT * FROM files WHERE md5 = '${md5}'`);
  return {
    isExist: !!results.length,
    file: results[0]
  }
};

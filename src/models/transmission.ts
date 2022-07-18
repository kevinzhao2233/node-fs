import { FieldPacket, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { conn } from './db';

export interface TransmissionModel {
  id: string;
  uid: string;
  description: string;
  expiration: string;
  need_password: string;
  password: string | null;
  share_link: string;
  create_at?: Date;
}

export const createTrans = async (values: TransmissionModel) => {
  const [results, fields]: [ResultSetHeader, FieldPacket[]] = await conn.query('INSERT INTO transmission SET ?', values);
  return {
    success: !!results.affectedRows,
  };
};

export const findTransById = async (id:string) => {
  const [results, fields]: [RowDataPacket[], FieldPacket[]] = await conn.query(`SELECT * FROM transmission WHERE id = '${id}'`);
  return {
    transmission: results[0],
  };
};

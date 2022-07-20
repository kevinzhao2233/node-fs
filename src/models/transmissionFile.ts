import { FieldPacket, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { conn } from './db';

export interface TransmissionFileModal {
  t_id: string;
  f_id: string;
}

export const createTransmissionFile = async (values: TransmissionFileModal) => {
  const [results, fields]: [ResultSetHeader, FieldPacket[]] = await conn.query('INSERT INTO transmission_file SET ?', values);
  return {
    success: !!results.affectedRows,
  };
};

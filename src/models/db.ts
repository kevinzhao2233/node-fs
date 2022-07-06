import mysql from 'mysql2/promise';

import { mysqlConfig } from '../config/dbConfig';

export const conn = mysql.createPool(mysqlConfig);


// 第三方模块
import express from 'express';
import { urlencoded, json } from 'body-parser';
import { NextFunction, Request, Response } from 'express';
import chalk from 'chalk';

// 自定义模块
import { systemConfig } from './config';

const app = express();

const startTime = Date.now();

// 处理 post 请求的请求体，限制大小最多为 20 兆
app.use(urlencoded({ limit: '20mb', extended: true }));
app.use(json({ limit: '20mb' }));

// error handler
app.use(function(err: Error, req: Request, res: Response, next: NextFunction) {
  return res.sendStatus(500);
});
app.get('/', function(req, res) {
  res.send('Hello World!');
});
app.listen(systemConfig.port, function() {
  console.log(
      chalk.cyan('\n  the server is start at:\n'),
      '\n  > Local', chalk.green(`http://localhost:${systemConfig.port}\n`),
      chalk.cyan(`\n  ready in ${Date.now() - startTime}ms\n`),
  );
});

export default app;

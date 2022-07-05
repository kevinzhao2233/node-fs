import fse from 'fs-extra';
import path from 'node:path';

export const mkdirsSync = (dirname: string) => {
  if (fse.existsSync(dirname)) {
    return true;
  } else {
    if (mkdirsSync(path.dirname(dirname))) {
      fse.mkdirSync(dirname);
      return true;
    }
  }
};

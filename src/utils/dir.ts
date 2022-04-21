const path = require('path');
const fse = require('fs-extra');

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

import path from 'path';

export const dirname = (pathSegments?: string[]) => {
  const temp = path.dirname(decodeURI(new URL(import.meta.url).pathname));
  return path.resolve(process.platform == 'win32' ? temp.substring(1) : temp, ...(pathSegments ? pathSegments : []));
};

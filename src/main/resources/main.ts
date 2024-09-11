const obj = {
  _nam_e: 'hello',
  Name: 'world',
  'n-a': 'foo',
}

// import { getResource } from '/lib/xp/io';

// [
//   // 'static',
//   // 'static/',
//   // '/static',
//   // '/static/',
//   // 'non-existant',
//   // 'non-existant/',
//   '/non-existant',
//   '/non-existant/',
//   // 'static/folder',
//   // 'static/folder/',
//   '/static/folder',
//   '/static/folder/',
//   // 'static/folder/index.html',
//   // 'static/folder/index.html/',
//   '/static/folder/index.html',
//   '/static/folder/index.html/',
// ].forEach((path) => {
//   const resource = getResource(path)
//   // log.info('path:%s resource:%s', JSON.stringify(resource, null, 2));

//   log.info('path:%s exists:%s', path, resource.exists());
//   log.info('path:%s size:%s', path, resource.getSize());
//   log.info('path:%s timestamp:%s', path, resource.getTimestamp());
// });

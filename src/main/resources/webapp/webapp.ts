// import {
//   assetUrl,
//   // @ts-expect-error not types
// } from '/lib/enonic/asset';
import {
  requestHandler,
  // @ts-expect-error not types
} from '/lib/enonic/static';
// @ts-expect-error not types
import Router from '/lib/router';

const router = Router();
router.get('{path:.*}', (request: Request)/*: Response*/ => {
  // const assetUrlString = assetUrl({
  //   // application: 'enonic',
  //   // params: {},
  //   path: 'index.css',
  //   type: 'absolute',
  // });
  // log.info('assetUrlString:%s', assetUrlString);
  return requestHandler({
    request,
    root: '/static/folder',
  });
//   return {
//     body: `<DOCTYPE html>
// <html>
//   <head>
//     <title>Title</title>
//     <link rel="stylesheet" href="${assetUrlString}">
//   </head>
//   <body>
//     <main>
//       <h1>Title</h1>
//     </main>
//   </body>
// </html>`,
//     status: 200,
//   };
});
export const all = (request: Request) => router.dispatch(request);

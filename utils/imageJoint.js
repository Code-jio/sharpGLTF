import fs from "fs";
import im from "imagemagick";
import sharp from "sharp";

import { Magick } from 'magickwand.js';
import { fileURLToPath } from 'url';
import * as path from 'path';

// // sharp图片拼接 将图片拼接成一张大图
// const imageJoint = (url, targetPath) => {
//   const files = fs.readdirSync(url);
//   const images = [];
//   for (const file of files) {
//     const fPath = path.join(url, file);
//     // 如果是图片文件
//     if (
//       fPath.endsWith(".png") ||
//       fPath.endsWith(".jpg") ||
//       fPath.endsWith(".jpeg") ||
//       fPath.endsWith(".webp") ||
//       fPath.endsWith(".tiff") ||
//       fPath.endsWith(".gif") ||
//       fPath.endsWith(".svg") ||
//       fPath.endsWith(".avif")
//     ) {
//       images.push(fPath);
//     }
//   }
//   // console.log("images", images);
// //   每行显示的图片数量
//   const row = 29;
//   const column = 22;
//   // 图片拼接
//   sharp({
//     create: {
//       width: 1447 * 22,
//       height: 945 * 29,
//       channels: 4,
//       background: { r: 255, g: 255, b: 255, alpha: 1 },
//     },
//   })
//     .composite(
//       images.map((image) => {
//         return {
//           input: image,
//         };
//       })
//     )
//     .toFile(targetPath)
//     .then((info) => {
//       console.log("info", info);
//     })
//     .catch((err) => {
//       console.log("err", err);
//     });
// };
// screenshot638有638张图片，每行显示22张，共29行，图片拼接的宽度是1447*22 = 31834，高度是945*29 = 27405。
// imagemagick 图片拼接
// image:[url,url,...] 拼接的图片路径
// output: 输出的图片路径
const imageJoint = (images, output) => {
    const row = 29;
    const column = 22;
    const command = `magick montage -mode concatenate -tile ${column}x${row} ${images.join(
      " "
    )} ${output}`;

    // 执行命令
    im.convert(command, function (err, stdout) {
        if (err) {
            console.log("err", err);
        }
        console.log("stdout", stdout);
    });


};

export default imageJoint;

// magick convert +append screenshot1.png screenshot2.png 1.jpg
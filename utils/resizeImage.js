// Description: 重置图片大小
import fs from "fs";
import path from "path";
import sharp from "sharp";

const __dirname = path.resolve();

const url = path.resolve(__dirname, "./image");
const targetPath = path.resolve(__dirname, "./image_resize");

// 循环遍历url下的所有文件
const readDir = (url, targetPath) => {
  const files = fs.readdirSync(url);
  // console.log("开始重置图片大小", url, targetPath);
  for (const file of files) {
    const fPath = path.join(url, file);
    const stats = fs.statSync(fPath);
    if (stats.isDirectory()) {
      readDir(fPath, targetPath);
    } else {
      // 如果是图片文件
      if (
        fPath.endsWith(".png") ||
        fPath.endsWith(".jpg") ||
        fPath.endsWith(".jpeg")
      ) {
        resizeImage(fPath, targetPath);
      }
    }
  }
};

// 检查是否是2的n次方，如果不是则找到最近的2次方
const isPowerOfTwo = (number) => {
  if (number === 0) return 0;
  if (number === 1) return 1;

  // 如果是2的n次方
  if (number & (number - 1)) {
    let i = 1;
    while (i < number) {
      i = i << 1;
    }
    // console.log("找到最近的2次方", i);
    return i;
  } else {
    return number;
  }
};

// 重置图片大小,并写入到指定文件夹
const resizeImage = (fPath, targetPath) => {
  const fileName = path.basename(fPath);
  const targetFile = path.join(targetPath, fileName);
  // 读取图片原有尺寸
  const image = sharp(fPath);
  image
    .metadata()
    .then((metadata) => {
      let newWidth = 0;
      let newHeight = 0;
      // 检查图片的宽高，如果宽高相等
      if (metadata.width === metadata.height) {
        // 如果宽高都小于1024，则不做处理
        if (metadata.width < 1024) {
          newWidth = metadata.width;
          newHeight = metadata.height;
        } else {
          newWidth = 1024;
          newHeight = 1024;
        }
      } else {
        let max = Math.max(metadata.width, metadata.height);
        // 将较大值设置为1024，较小值等比例缩放
        if (max === metadata.width) {
          newWidth = 1024;
          newHeight = Math.floor((metadata.height * 1024) / metadata.width);
        } else {
          newHeight = 1024;
          newWidth = Math.floor((metadata.width * 1024) / metadata.height);
        }
      }

      // 强制变成2的n次方
      // newWidth = isPowerOfTwo(newWidth);
      // newHeight = isPowerOfTwo(newHeight);

      console.log("newWidth", newWidth, "newHeight", newHeight);
      // 如果图片宽高都小于1024，则不做处理

      image
        .resize(newWidth, newHeight)
        .toFile(targetFile)
        .then((info) => {
          // console.log("重置图片大小完成", info);
        })
        .catch((err) => {
          console.error("重置图片大小失败", err);
        });

      // 重置图片大小
    })
    .catch((err) => {
      console.error("读取图片原有尺寸失败", err);
    });
};

readDir(url, targetPath);

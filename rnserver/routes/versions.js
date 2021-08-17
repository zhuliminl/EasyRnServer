var express = require('express');
var path = require('path');
const fs = require('fs')
const Fse = require('fs-extra')
const multer = require('multer')
var router = express.Router();


const bundleBasePath = './tmp'

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const versionCode = new Date().getTime()
    const bundlePath = `${bundleBasePath}/${versionCode}`
    const filename = file.fieldname + path.extname(file.originalname)
    fs.mkdirSync(bundlePath, { recursive: true })
    req.passData = {
      bundlePath,
      versionCode,
      filename,
      body: req.body,
    }
    // 写入 json 文件

    cb(null, bundlePath)
  },
  filename: function (req, file, cb) {
    const { passData = {} } = req
    const {
      bundlePath = '',
      versionCode = '',
      filename = '',
    } = passData

    cb(null, filename);
  }
})
// var upload = multer({ storage: storage, limits: { fileSize: 100000000 } }).any()
var upload = multer({ storage: storage, limits: { fileSize: 100000000000 } }).single('bundle')


router.post('/bundleUpload', upload, transformToPackage, function (req, res, next) {
  const { body = {} } = req
  const { file = [] } = req
  console.log('saul Body', body)
  console.log('saul UPLOAD _________', file)
  if (JSON.stringify(file) === '[]') {
    return res.json({ code: 1001, message: '上传文件为空', data: body })
  }


  res.json({ code: 200, message: '成功上传 RN 包 ', data: body })
});

router.get('/bundleCheck', async function (req, res, next) {
  const { query = {} } = req
  const { version = '' } = query
  const files = await Fse.readdir(__dirname + '/../bundles');
  const baseUrl = 'http://192.168.3.27:3000/'
  const bundlePaths = files.map(item => baseUrl + item)

  if (!version) {
    return res.json({ code: 1001, message: '版本信息为空', })
  }

  return res.json({
    code: 200, message: '返回最新包列表', data: {
      bundlePaths
    }
  })
});

function transformToPackage(req, res, next) {
  const { passData = {} } = req
  const {
    bundlePath = '',
    versionCode = '',
    filename = '',
  } = passData
  fs.writeFileSync(`${bundlePath}/desc.json`, JSON.stringify({ ...passData }, null, 2));
  // 转化称 package 并生成对应的 差分包

  next()
}



module.exports = router;

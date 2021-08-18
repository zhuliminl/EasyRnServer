var express = require('express');
var path = require('path');
const fs = require('fs')
const Fse = require('fs-extra')
const multer = require('multer')
var AdmZip = require("adm-zip");

var router = express.Router();


const tmpPath = './tmp'
const BUNDLE_PATH = './bundle'


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const versionCode = new Date().getTime()
    const _bundlePath = `${tmpPath}/${versionCode}`
    const filename = file.fieldname + path.extname(file.originalname)
    fs.mkdirSync(_bundlePath, { recursive: true })
    req.passData = {
      _bundlePath,
      versionCode,
      filename,
      body: req.body,
    }
    cb(null, _bundlePath)
  },
  filename: function (req, file, cb) {
    const { passData = {} } = req
    const { _bundlePath = '', versionCode = '', filename = '', } = passData
    cb(null, filename);
  }
})

var upload = multer({ storage: storage, limits: { fileSize: 100000000000 } }).single('bundle')
router.post('/bundleUpload', upload, transformToPackage, function (req, res, next) {
  const { body = {} } = req
  const { file = [] } = req
  if (JSON.stringify(file) === '[]') {
    return res.json({ code: 1001, message: '上传文件为空', data: body })
  }

  res.json({ code: 200, message: '成功上传 RN 包 ', data: body })
})

router.get('/bundleCheck', async function (req, res, next) {
  const { query = {} } = req
  const { version = '' } = query
  const files = await Fse.readdir(__dirname + '/../bundles');
  const baseUrl = 'http://192.168.3.27:3000/'
  const _bundlePaths = files.map(item => baseUrl + item)

  if (!version) {
    return res.json({ code: 1001, message: '版本信息为空', })
  }

  return res.json({
    code: 200, message: '返回最新包列表', data: {
      _bundlePaths
    }
  })
})

function transformToPackage(req, res, next) {
  const { passData = {} } = req
  const {
    _bundlePath = '',
    versionCode = '',
    filename = '',
  } = passData
  const bundlePath = `${BUNDLE_PATH}/${versionCode}`
  fs.mkdirSync(bundlePath, { recursive: true })
  fs.writeFileSync(`${bundlePath}/desc.json`, JSON.stringify({ ...passData }, null, 2));
  const zipFilePath = `${_bundlePath}/${filename}`
  const zip = new AdmZip(zipFilePath);
  zip.extractAllTo(bundlePath, true)
  next()
}



module.exports = router;

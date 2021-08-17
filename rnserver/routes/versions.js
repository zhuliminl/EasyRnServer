var express = require('express');
var path = require('path');
const Fse = require('fs-extra')
const multer = require('multer')
var router = express.Router();


const bundlePath = './bundles'
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, bundlePath)
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '_' + Date.now() + path.extname(file.originalname));
  }
})
// var upload = multer({ storage: storage, limits: { fileSize: 100000000 } }).any()
var upload = multer({ storage: storage, limits: { fileSize: 100000000000 } }).single('bundle')

router.post('/bundleUpload', upload, function (req, res, next) {
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



module.exports = router;

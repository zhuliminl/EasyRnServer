var express = require('express');
var path = require('path');
const multer = require('multer')
var router = express.Router();


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './bundles')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '_' + Date.now() + path.extname(file.originalname));
  }
})
var upload = multer({ storage: storage, limits: { fileSize: 100000000 } }).any()

router.post('/bundleUpload', upload, function (req, res, next) {
  const { body = {} } = req
  console.log('body', req.body)
  res.json({ code: 200, message: '成功上传 RN 包 ', data: body })
});

router.get('/bundleCheck', function (req, res, next) {
  const { query = {} } = req
  const { version = '' } = query
  if (!version) {
    return res.json({ code: 1001, message: '版本信息为空', data: query })
  }

  return res.json({ code: 200 })
});

module.exports = router;

var express = require('express');
var path = require('path');
const fs = require('fs')
const Fse = require('fs-extra')
const multer = require('multer')
var AdmZip = require("adm-zip");
const moment = require('moment')
const rmdir = require('rimraf');
const { exec } = require("child_process");


var router = express.Router();


const tmpPath = './tmp'
const BUNDLE_PATH = './bizBundles'


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { body } = req
    const { biz = 'unknown-biz' } = body
    console.log('saul Body>>>>>>>>>', body)
    const versionCode = `${biz}_${moment(new Date()).format('YYYYMMDDHHmmSS')}`
    // const versionCode = new Date().getTime()
    // console.log('########', versionCode)
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
// var upload = multer({ storage: storage, limits: { fileSize: 100000000000 } }).any()
router.post('/bundleUpload', passBody, upload, transformToPackage, function (req, res, next) {
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

function passBody(req, res, next) {
  // console.log('saul body', req.body)
  next()
}

function transformToPackage(req, res, next) {
  const { passData = {} } = req
  const {
    _bundlePath = '',
    versionCode = '',
    filename = '',
  } = passData
  const bundlePath = `${BUNDLE_PATH}/${versionCode}`
  const iosPath = bundlePath + '/ios'
  const androidPath = bundlePath + '/android'
  // 创建平台 pack 文件夹
  fs.mkdirSync(iosPath, { recursive: true })
  fs.mkdirSync(androidPath, { recursive: true })

  // 创建平台 pack desc 
  fs.writeFileSync(`${iosPath}/desc.json`, JSON.stringify({ ...passData }, null, 2));
  fs.writeFileSync(`${androidPath}/desc.json`, JSON.stringify({ ...passData }, null, 2));

  // 分别解压到各自平台
  const zipFilePath = `${_bundlePath}/${filename}`
  const zip = new AdmZip(zipFilePath);
  zip.extractAllTo(bundlePath, true)

  fs.rename(`${bundlePath}/bundle/android`, `${androidPath}/bundle`, err => {
    console.log('renameAndroidError', err)

    var zip_pack_android = new AdmZip()
    zip_pack_android.addLocalFolder(`${androidPath}/bundle`)
    zip_pack_android.writeZip(`${bundlePath}/pack_android.zip`)


  })
  fs.rename(`${bundlePath}/bundle/ios`, `${iosPath}/bundle`, err => {
    console.log('renameIosError', err)

    var zip_pack_android = new AdmZip()
    zip_pack_android.addLocalFolder(`${iosPath}/bundle`)
    zip_pack_android.writeZip(`${bundlePath}/pack_ios.zip`)

  })



  // 清理文件夹
  rmdir(`${bundlePath}/bundle`, err => {
    console.log('remove bundle Err', err)
  })

  rmdir(`${_bundlePath}`, err => {
    console.log('remove bundle Err', err)
  })

  // 找到之前 4 个版本的文件，并生成 patch 包


  next()
}



module.exports = router;

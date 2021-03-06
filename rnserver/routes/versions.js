var express = require('express');
var path = require('path');
const fs = require('fs')
const Fse = require('fs-extra')
const multer = require('multer')
var AdmZip = require("adm-zip");
const moment = require('moment')
const rmdir = require('rimraf');
const bsTool = require('./utils/bsTool')


var router = express.Router();


const tmpPath = './tmp'
const BUNDLE_PATH = './bizBundles'


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { body } = req
    const { biz = 'unknown-biz' } = body
    console.log('saul Body>>>>>>>>>', body)
    // const versionCode = `${biz}_${moment(new Date()).format('YYYYMMDDHHmmSS')}`
    const versionCode = `${moment(new Date()).format('YYYYMMDDHHmmSS')}`
    // const versionCode = new Date().getTime()
    // console.log('########', versionCode)
    const _bundlePath = `${tmpPath}/${biz}/${versionCode}`
    const filename = file.fieldname + path.extname(file.originalname)
    fs.mkdirSync(_bundlePath, { recursive: true })
    req.passData = {
      _bundlePath,
      versionCode,
      filename,
      biz,
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

  console.log('saul >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
  res.json({ code: 200, message: '成功上传 RN 包 ', data: body })
})


function passBody(req, res, next) {
  console.log('saul body', req.body)
  next()
}

async function transformToPackage(req, res, next) {
  const { passData = {} } = req
  const {
    _bundlePath = '',
    versionCode = '',
    filename = '',
    biz = ''
  } = passData
  console.log('saul ##############################', biz)
  const bundlePath = `${BUNDLE_PATH}/${biz}/${versionCode}`
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


  // 实际设计中， patch 应该由服务来调度，而不是打包过程中产生
  // patch 应该只作为一个备选项。可随时脱离，降级。不应该强依赖
  const createPatchForPlatform = async (platorm) => {
    // 从历史版本中打出 patch 包
    try {
      const packsAll = await Fse.readdir(`${BUNDLE_PATH}/${biz}`)
      const packsBefore = packsAll.filter(item => item !== versionCode)
      // .map(item => `${BUNDLE_PATH}/${item}/pack_${platorm}.zip`)

      const createPatch = bsTool.diff
      const resAll = await Promise.all(packsBefore.map(pack => {
        const pack_zip = `${BUNDLE_PATH}/${biz}/${pack}/pack_${platorm}.zip`
        const currenPack_zip = `${bundlePath}/pack_${platorm}.zip`
        const patch_file = `${BUNDLE_PATH}/${biz}/${pack}/patch_${platorm}`
        return createPatch(pack_zip, currenPack_zip, patch_file)
      }))
      console.log('saul android resAll', resAll)

    } catch (error) {
      console.log('saul ###', error)
    }

  }
  fs.rename(`${bundlePath}/bundle/android`, `${androidPath}/bundle`, async (err) => {
    console.log('renameAndroidError', err)

    var zip_pack_android = new AdmZip()
    zip_pack_android.addLocalFolder(`${androidPath}/bundle`)
    zip_pack_android.writeZip(`${bundlePath}/pack_android.zip`)
    createPatchForPlatform('android')
  })
  fs.rename(`${bundlePath}/bundle/ios`, `${iosPath}/bundle`, err => {
    console.log('renameIosError', err)

    var zip_pack_android = new AdmZip()
    zip_pack_android.addLocalFolder(`${iosPath}/bundle`)
    zip_pack_android.writeZip(`${bundlePath}/pack_ios.zip`)
    createPatchForPlatform('ios')

  })



  // 清理文件夹
  rmdir(`${bundlePath}/bundle`, err => {
    console.log('remove bundle Err', err)
  })

  rmdir(`${_bundlePath}`, err => {
    console.log('remove bundle Err', err)
  })

  // 找到之前 4 个版本的文件，并生成 patch 包
  /*
  try {
    const data = await bsTool.diff(
      'bizBundles/WelecomPage_20210821115917/pack_android.zip',
      'bizBundles/WelecomPage_20210821120429/pack_android.zip',
      'bizBundles/WelecomPage_20210821120429/patch'
    )
    console.log('saul diff res', data)

  } catch (error) {
    console.log('saul bsdiff error', error)
  }

  try {
    const data = await bsTool.patch(
      'bizBundles/WelecomPage_20210821115917/pack_android.zip',
      'bizBundles/WelecomPage_20210821120429/pack_android_merge.zip',
      'bizBundles/WelecomPage_20210821120429/patch'
    )

  } catch (error) {
    console.log('saul bsdiff error', error)
  }
  */

  next()
}

router.get('/bundleCheck', async function (req, res, next) {
  const { query = {} } = req
  const { version = '' } = query
  // const files = await Fse.readdir(__dirname + '/../bundles');
  // const baseUrl = 'http://192.168.3.27:3000/'
  // const _bundlePaths = files.map(item => baseUrl + item)

  if (!version) {
    return res.json({ code: 1001, message: '版本信息为空', })
  }

  return res.json({
    code: 200, message: '返回最新包列表', data: {
      // _bundlePaths
    }
  })
})

router.get('/bundles', async function (req, res, next) {
  const { query = {} } = req
  const { version = '' } = query
  const bizs = await Fse.readdir(BUNDLE_PATH)
  const bizsVersions = await Promise.all(bizs.map(async (biz) => {
    const vpath = await Fse.readdir(`${BUNDLE_PATH}/${biz}`)
    const vpathNew = vpath[0]
    const pathAndroid = vpathNew + '/pack_android.zip'
    const pathIos = vpathNew + '/pack_ios.zip'
    const baseUrl = 'http://localhost:3000/'
    return {
      biz,
      downloadUrl: {
        android: baseUrl + biz + '/' + pathAndroid,
        ios: baseUrl + biz + '/' + pathIos,
      }
    }
  }))

  return res.json({
    code: 200, message: '返回最新包列表', data: {
      bizsVersions
    }
  })
})



module.exports = router;

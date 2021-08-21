const { exec } = require("child_process");

const bsTool = {
  diff: (oldFile = '', newFile = '', patchFile = '') => {
    console.log('DIFF >>', oldFile, newFile, patchFile)
    return new Promise((resolve, reject) => {
      exec(`bsdiff ${oldFile} ${newFile} ${patchFile}`, (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          return reject(error)
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          return reject(stderr)
        }
        return resolve(stdout)
      })
    })

  },
  patch: (oldFile = '', resultFile = '', patchFile = '') => {
    return new Promise((resolve, reject) => {
      exec(`bspatch ${oldFile} ${resultFile} ${patchFile}`, (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          return reject(error)
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          return reject(stderr)
        }
        return resolve(stdout)
      })
    })
  },
}

module.exports = bsTool

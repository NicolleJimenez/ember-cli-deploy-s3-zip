'use strict'

const S3 = require('aws-sdk/clients/s3')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

class S3Uploader {
  constructor (options) {
    const { region, bucket, name, accessKeyId, secretAccessKey, plugin } = options
    this.bucket = bucket
    this.name = name
    this.plugin = plugin
    this.s3 = new S3({
      apiVersion: '2006-03-01',
      signatureVersion: 'v4',
      region,
      accessKeyId,
      secretAccessKey
    })
  }

  exec (command) {
    return new Promise((resolve, reject) => {
      exec(command, (error) => {
        if (error) {
          this.plugin.log(`Error running command ${command} ${error}`, { color: 'red' })
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  createZip (distDir) {
    const currentDir = process.cwd()
    const dirPath = path.join(currentDir, path.dirname(distDir)) // tmp => path/to/dist
    const dirName = path.basename(distDir) // deploy-dist => dist name
    const destinationZipPath = path.join(currentDir, this.name) // ${CURRENT-DIR}/fastboot.zip
    // Extracted from: https://superuser.com/questions/119649/avoid-unwanted-path-in-zip-file/119661#119661
    // cd tmp
    // zip -qr current-dir/fastboot.zip deploy-dist
    // cd current-dir
    process.chdir(dirPath)
    return this.exec(`zip -qr ${destinationZipPath} ${dirName}`) // zip -qr current-dir/fastboot.zip deploy-dist
      .then(() => {
        process.chdir(currentDir)
        this.plugin.log(`zip from path=${distDir} successfully created`, { verbose: true })
      })
  }

  uploadZip (zipPathS3) {
    const file = fs.createReadStream(this.name)
    const destination = zipPathS3 ? `${zipPathS3}/${this.name}` : this.name
    this.plugin.log(`uploding file=${this.name} to destination=${destination} bucket=${this.bucket}`, { verbose: true })
    const params = {
      Bucket: this.bucket,
      Key: destination,
      Body: file
    }

    return this.s3.putObject(params).promise()
  }
}

module.exports = S3Uploader

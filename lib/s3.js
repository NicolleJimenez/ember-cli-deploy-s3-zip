'use strict'

const S3 = require('aws-sdk/clients/s3')
const fs = require('fs')
const spawn = require('child_process').spawn

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
  createZip (distDir) {
    return new Promise((resolve, reject) => {
      const archive = spawn('zip', [ '-qr', this.name, distDir ])
      archive.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(code))
        } else {
          this.plugin.log(`zip from path=${distDir} successfully created`, { verbose: true })
          resolve()
        }
      })
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

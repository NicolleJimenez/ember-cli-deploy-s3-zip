/* eslint-env node */
'use strict'
const DeployPluginBase = require('ember-cli-deploy-plugin')
const S3 = require('./lib/s3')

module.exports = {
  name: 'ember-cli-deploy-s3-zip',
  createDeployPlugin: function (options) {
    const DeployPlugin = DeployPluginBase.extend({
      name: options.name,
      defaultConfig: {
        distDir: function (context) {
          return context.distDir
        }
      },
      requiredConfig: ['bucket', 'name', 'region'],
      didDeploy: function (context) {
        const bucket = this.readConfig('bucket')
        const region = this.readConfig('region')
        const accessKeyId = this.readConfig('accessKeyId')
        const secretAccessKey = this.readConfig('secretAccessKey')
        const zipPathS3 = this.readConfig('zipPathS3')
        const name = this.readConfig('name')
        const distDir = this.readConfig('distDir')
        const s3 = new S3({ bucket, region, name, accessKeyId, secretAccessKey, plugin: this })

        this.log(`creating zip from path=${distDir}`, { verbose: true })
        return s3.createZip(distDir)
          .then(() => s3.uploadZip(zipPathS3))
          .then(() => {
            this.log(`${name} already uploaded to s3 bucket=${bucket}`, { verbose: true })
          })
          .catch((error) => {
            this.log(`Error: ${error}`, { color: 'red' })
          })
      }
    })

    return new DeployPlugin()
  }
}

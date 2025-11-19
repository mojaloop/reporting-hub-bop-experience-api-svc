/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the
 Apache License, Version 2.0 (the 'License') and you may not use these files
 except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files
 are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied. See the License for the specific language
 governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Vijay Kumar Guthi <vijaya.guthi@modusbox.com>

 --------------
 ******/
// workaround for lack of typescript types for mojaloop dependencies
/// <reference path="../../ambient.d.ts"/>

import http from 'http'

import express, { Request, Response } from 'express'
import { createProxyMiddleware, fixRequestBody, responseInterceptor } from 'http-proxy-middleware'

import { logger } from '~/shared/logger'

import Config from '../shared/config'
import { logger } from '../shared/logger'

import CentralAdmin from './modifiers/central-admin'

const app = express()
let appInstance: http.Server

function setProxyBody (proxyReq: any, body: any) {
  const newBody = JSON.stringify(body)
  proxyReq.setHeader('content-length', newBody.length)
  proxyReq.write(newBody)
  proxyReq.end()
}

function getUserId (headers: any) {
  return headers['x-email']
}

// proxy middleware options
const commonOptions = {
  changeOrigin: true,
  logLevel: <'error' | 'debug' | 'info' | 'warn' | 'silent' | undefined>'debug',
  proxyTimeout: Config.PROXY_TIMEOUT,
  selfHandleResponse: true
}
const centralAdminOptions = {
  ...commonOptions,
  target: Config.CENTRAL_ADMIN_URL,
  pathRewrite: {
    '^/central-admin': ''
  },
  on: {
    error: function (err: any, req: any, res: any) {
      res.writeHead(500, {
        'Content-Type': 'text/plain'
      })
      res.end('Something went wrong while proxying the request.')
      CentralAdmin.handleErrorResponseEvent(req, {
        errorCode: err.code,
        errorMessage: err.message
      })
    },
    proxyReq: function (proxyReq: any, req: any) {
      logger.debug('Proxy Request:', {
        method: req.method,
        url: req.originalUrl || req.url,
        headers: req.headers,
        body: req.body
      })

      if (!req.body || !Object.keys(req.body).length) {
        return
      }
      const userid = getUserId(req.headers)

      // Handle different types of requests
      if (req.path.match(/\/participants\/.*\/accounts\/.*/g) && req.method === 'POST') {
        // Handle participant account requests
        const { body } = CentralAdmin.addUserToExtensionList(userid, req.headers, req.body)
        logger.debug('Modified participant account request body:', body)
        setProxyBody(proxyReq, body)
      } else if (req.path.match(/\/transfers.*/g) && userid && req.body.transferId) {
        // Handle transfer requests - add email as extension for settlement audit
        // This is essential for the settlement audit report to track who initiated transfers
        const { body } = CentralAdmin.addUserToExtensionList(userid, req.headers, req.body)
        logger.debug('Modified transfer request body:', body)
        setProxyBody(proxyReq, body)
      } else {
        fixRequestBody(proxyReq, req)
      }
      CentralAdmin.handleRequestEvent(req)
    },
    proxyRes: function (proxyRes: any, req: any, res: any) {
      const interceptFn = responseInterceptor(async (responseBuffer, proxyRes, req) => {
        const responseBody = responseBuffer.toString('utf8')
        let responseObject = responseBody
        try {
          responseObject = JSON.parse(responseObject)
        } catch (err: any) {
          logger.error(`Failed to parse response body: ${err.message}`, { responseBody })
        }

        logger.debug('Proxy Response:', {
          statusCode: proxyRes.statusCode,
          statusMessage: proxyRes.statusMessage,
          headers: proxyRes.headers,
          body: responseObject
        })

        CentralAdmin.handleResponseEvent(req, {
          statusCode: proxyRes.statusCode,
          statusMessage: proxyRes.statusMessage,
          headers: proxyRes.headers,
          payload: responseObject
        })
        return responseBody
      })
      return interceptFn(proxyRes, req, res)
    }
  }
}

async function run (): Promise<void> {
  app.use(express.json())
  // app.use(express.urlencoded())
  app.use('/central-admin', createProxyMiddleware<Request, Response>(centralAdminOptions))
  // Health Endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'OK'
    })
  })
  appInstance = app.listen(Config.PORT)
  logger.info(`service is running on port ${Config.PORT}`)
}

async function terminate (): Promise<void> {
  if (appInstance) {
    appInstance.close()
  }
  logger.info('service stopped')
}

function getApp (): any {
  return app
}

export default {
  run,
  getApp,
  terminate
}

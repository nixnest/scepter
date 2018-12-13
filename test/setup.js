'use strict'

const chai = require('chai')
const sinon = require('sinon')

// chai.config.includeStack = true
chai.use(require('sinon-chai'))

global.chai = chai
global.expect = chai.expect
global.sinon = sinon

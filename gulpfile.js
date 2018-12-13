'use strict'

const gulp = require('gulp')
const mocha = require('gulp-mocha')
const standard = require('gulp-standard')

const CI = process.env.CI === 'true'

const entrypoint = require('./package.json')['main']
const paths = {
  sources: [entrypoint, 'lib/**/*.js'],
  gulp: ['./gulpfile.js'],
  tests: ['test/**/*.test.js'],
  testsSetup: ['./test/setup.js']
}

const all = Array.prototype.concat.apply([], Object.keys(paths).map(x => paths[x]))

function style () {
  return gulp.src(all.concat('./gulpfile.js'))
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: true,
      quiet: true
    }))
}

function unit () {
  return gulp.src(paths.tests, { read: false })
    .pipe(mocha({
      require: paths.testsSetup,
      reporter: CI ? 'spec' : 'nyan'
    }))
}

function watch () {
  gulp.watch(paths.sources, unit)
  gulp.watch(all, style)
}

const test = gulp.series(style, unit)

exports.watch = watch
exports.unit = unit
exports.style = style
exports.test = test

exports.default = test

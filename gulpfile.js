'use strict'

const gulp = require('gulp')
const mocha = require('gulp-mocha')
const ts = require('typescript')
const gulpTslint = require('gulp-tslint')
const tslint = require('tslint')

const CI = process.env.CI === 'true'

const entrypoint = require('./package.json')['main']
const paths = {
  sources: ['./scepter.ts', 'lib/**/*.ts'],
  gulp: ['./gulpfile.js'],
  modules: ['./modules/**/*'],
  tests: ['test/**/*.test.js'],
  testsSetup: ['./test/setup.js']
}

const all = Array.prototype.concat.apply([], Object.keys(paths).map(x => paths[x]))

function style () {
  const program = tslint.Linter.createProgram('./tsconfig.json', '.')
  ts.getPreEmitDiagnostics(program)

  return gulp.src(all.concat('./gulpfile.js'))
    .pipe(gulpTslint({ program }))
    .pipe(gulpTslint.report())
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

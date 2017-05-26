var from = require('from2')
var quote = require('quote-stream')
var through = require('through2')

var BGN_OBJ = '{'
var END_OBJ = '}'
var BGN_ARR = '['
var END_ARR = ']'
var SEP = ','

module.exports = rummage

function rummage (value) {
  return from(function (size, cb) {
    var self = this
    read.call(this, value, function () {
      self.push('\n')
      cb(null, null)
    })
  })
}

function read (value, done) {
  var self = this
  if (isStream(value)) {
    value.pipe(quote()).pipe(writer())
  } else if (value && isStream(value._json)) {
    value._json.pipe(writer())
  } else if (value && isStream(value._string)) {
    value._string.pipe(quote()).pipe(writer())
  } else if (value && isStream(value._array)) {
    value._array.pipe(array()).pipe(writer())
  } else if (value && isStream(value._object)) {
    value._object.pipe(object()).pipe(writer())
  } else if (value && typeof value.toJSON === 'function') {
    self.push(JSON.stringify(value.toJSON()))
    done()
  } else if (Array.isArray(value) || isObject(value)) {
    walk.call(self, value, done)
  } else {
    self.push(JSON.stringify(value))
    done()
  }

  function writer () {
    return through.obj(function (chunk, enc, cb) {
      self.push(chunk)
      cb()
    }, function (cb) {
      cb()
      done()
    })
  }
}

function walk (value, cb) {
  var self = this
  var keys = Object.keys(value)
  var arr = Array.isArray(value)

  if (arr) this.push(BGN_ARR)
  else this.push(BGN_OBJ)
  next()

  function next () {
    var k = keys.shift()
    var v = value[k]
    if (!isValid(v)) {
      if (arr) v = null
      else return next(value)
    }
    if (!arr) self.push(JSON.stringify(k) + ':')
    read.call(self, v, done)
  }

  function done (err) {
    if (err) return cb(err)
    if (keys.length) {
      self.push(SEP)
      next(value)
    } else {
      if (arr) self.push(END_ARR)
      else self.push(END_OBJ)
      cb()
    }
  }
}

function array () {
  var first = true
  var t = through.obj(write, end)
  t.push(BGN_ARR)
  return t

  function write (chunk, enc, cb) {
    if (!isValid(chunk)) chunk = null
    if (!first) this.push(SEP)
    first = false
    read.call(this, chunk, cb)
  }

  function end (cb) {
    this.push(END_ARR)
    cb()
  }
}

function object () {
  var first = true
  var t = through.obj(write, end)
  t.push(BGN_OBJ)
  return t

  function write (chunk, enc, cb) {
    if (!isValid(chunk[1])) return cb()
    if (!first) this.push(SEP)
    first = false
    this.push(JSON.stringify(String(chunk[0])) + ':')
    read.call(this, chunk[1], cb)
  }

  function end (cb) {
    this.push(END_OBJ)
    cb()
  }
}

function isValid (value) {
  return typeof value === 'string' || typeof value === 'number' ||
         typeof value === 'boolean' || value === null ||
         value instanceof Date || Array.isArray(value) || isObject(value)
}

function isObject (value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function isStream (value) {
  return value && typeof value.pipe === 'function'
}

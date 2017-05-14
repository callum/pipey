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
    write.call(this, value, null, done)

    function done (err) {
      if (err) return cb(err)
      cb(null, null)
    }
  })
}

function write (value, type, done) {
  var self = this
  if (isStream(value)) {
    var writer = through.obj(function (chunk, enc, cb) {
      self.push(chunk)
      cb()
    }, function (cb) {
      cb()
      done()
    })
    if (type === '_array') value.pipe(array()).pipe(writer)
    else if (type === '_object') value.pipe(object()).pipe(writer)
    else if (type === '_json') value.pipe(writer)
    else value.pipe(quote()).pipe(writer)
  } else if (value && typeof value.toJSON === 'function') {
    self.push(JSON.stringify(value.toJSON()))
    done()
  } else if (Array.isArray(value) || isObject(value)) {
    walk.call(self, value, done)
  } else {
    if (type === '_json') self.push(value)
    else self.push(JSON.stringify(value))
    done()
  }
}

function walk (value, cb) {
  var self = this
  var keys = Object.keys(value)
  var arr = Array.isArray(value)

  if (isType(keys[0])) {
    write.call(this, value[keys[0]], keys[0], cb)
    return
  }

  if (arr) this.push(BGN_ARR)
  else this.push(BGN_OBJ)
  next()

  function next () {
    var k = keys.shift()
    var v = value[k]
    if (!isValid(v)) {
      if (!arr) return next(value)
      v = null
    }
    if (!arr) self.push(JSON.stringify(k) + ':')
    write.call(self, v, null, done)
  }

  function done (err) {
    if (err) return cb(err)
    if (keys.length) {
      self.push(SEP)
      next(value)
    } else {
      if (arr) self.push(END_ARR)
      else self.push(END_OBJ)
      self.push('\n')
      cb()
    }
  }
}

function array () {
  var first = true
  return through.obj(function (chunk, enc, cb) {
    if (first) this.push(BGN_ARR)
    else this.push(SEP)
    first = false
    if (!isValid(chunk)) chunk = null
    write.call(this, chunk, null, cb)
  }, function (cb) {
    this.push(END_ARR)
    cb()
  })
}

function object () {
  var first = true
  return through.obj(function (chunk, enc, cb) {
    var self = this
    if (!isValid(chunk[1])) return cb()
    if (first) self.push(BGN_OBJ)
    else self.push(SEP)
    first = false
    self.push(JSON.stringify(String(chunk[0])) + ':')
    write.call(self, chunk[1], null, cb)
  }, function (cb) {
    this.push(END_OBJ)
    cb()
  })
}

function isType (key) {
  return key === '_array' || key === '_object' || key === '_string' ||
         key === '_json'
}

function isValid (value) {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ||
         value === null || value instanceof Date || Array.isArray(value) || isObject(value)
}

function isObject (value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function isStream (value) {
  return value && typeof value.pipe === 'function'
}

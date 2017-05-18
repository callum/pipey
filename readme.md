# rummage

stream friendly JSON.stringify

[![Build Status](https://travis-ci.org/callum/rummage.svg?branch=master)](https://travis-ci.org/callum/rummage)

## installation

```
npm install rummage
```

## example

```js
var fs = require('fs')
var rummage = require('rummage')

rummage({
  message: fs.createReadStream(__dirname + '/message.txt')
}).pipe(process.stdout)

// produces

'{"message":"contents of message.txt\n"}'
```

## special types

By default stream data is concatenated and output as a string, as per the above example. However, there are special instructions to treat streams as arrays, objects or raw JSON.

Imagine you want to retrieve a list of newline-delimited messages from a file and output them as JSON:

```js
var fs = require('fs')
var rummage = require('rummage')
var split = require('split2')

rummage({
  messages: { _array: messages() } // output as an array
}).pipe(process.stdout)

function messages () {
  return fs.createReadStream(__dirname + '/messages.txt').pipe(split())
}

// produces

'{"messages":["message 1","message 2","message 3"]}\n'
```

Or as an object:

```js
var fs = require('fs')
var rummage = require('rummage')
var split = require('split2')
var through = require('through2')

rummage({
  messages: { _object: messages() } // output as an object
}).pipe(process.stdout)

function messages () {
  return fs.createReadStream(__dirname + '/messages.txt')
    .pipe(split())
    .pipe(through.obj(write))

  // transform so that we get [key, value] for each message
  function write (chunk, enc, cb) {
    var key = chunk.toString('utf8').slice(-1)
    cb(null, [key, chunk])
  }
}

// produces

'{"messages":{"1":"message 1","2":"message 2","3":"message 3"]}\n'
```

And lastly, as raw JSON:

```js
var fs = require('fs')
var rummage = require('rummage')

rummage({
  messages: { _json: messages() } // output as json
}).pipe(process.stdout)

function messages () {
  return fs.createReadStream(__dirname + '/messages.json')
}

// produces

'{"messages":{"1":"message 1","2":"message 2","3":"message 3"]}\n'
```

## api

### var stream = rummage(value)

Return a new readable `stream` of JSON from `value`

If a stream is encountered within `value`, or `value` is itself a stream, its data will be concatenated and output as a string by default. This behaviour can be overridden using special types, which are:

- `_string` - output `value` as a string (default)
- `_json` - output `value` as raw JSON
- `_array` - output `value` as an array
- `_object` - output `value` as an object. Each chunk of `value` must be an array consisting of `[key, value]`

See above for examples

## similar modules

- [gutter](https://www.npmjs.com/package/gutter)
- [JSONStream](https://www.npmjs.com/package/JSONStream)
- [streaming-json-stringify](https://www.npmjs.com/package/streaming-json-stringify)

## license

MIT

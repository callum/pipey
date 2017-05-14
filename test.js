var test = require('tape')
var concat = require('concat-stream')
var from = require('from2')
var rummage = require('./')

test('stringify', function (t) {
  t.plan(12)
  rummage('foo "bar" baz').pipe(concat(function (res) {
    t.equal(res.toString('utf8'), '"foo \\"bar\\" baz"')
  }))
  rummage(0).pipe(concat(function (res) {
    t.equal(res.toString('utf8'), '0')
  }))
  rummage(true).pipe(concat(function (res) {
    t.equal(res.toString('utf8'), 'true')
  }))
  rummage(new Date(2017, 0, 1)).pipe(concat(function (res) {
    t.equal(res.toString('utf8'), '"2017-01-01T00:00:00.000Z"')
  }))
  rummage(undefined).pipe(concat(function (res) {
    t.equal(res.toString('utf8'), '')
  }))
  rummage(function () {}).pipe(concat(function (res) {
    t.equal(res.toString('utf8'), '')
  }))
  rummage([function () {}]).pipe(concat(function (res) {
    t.equal(res.toString('utf8'), '[null]\n')
  }))
  rummage(['foo', 'bar', 'baz']).pipe(concat(function (res) {
    t.equal(res.toString('utf8'), '["foo","bar","baz"]\n')
  }))
  rummage('{"foo":"foo","bar":"bar","baz":"baz"}').pipe(concat(function (res) {
    t.equal(res.toString('utf8'), '"{\\"foo\\":\\"foo\\",\\"bar\\":\\"bar\\",\\"baz\\":\\"baz\\"}"')
  }))
  rummage({
    toJSON: function () {
      return 'foo "bar" baz'
    }
  }).pipe(concat(function (res) {
    t.equal(res.toString('utf8'), '"foo \\"bar\\" baz"')
  }))
  rummage(string()).pipe(concat(function (res) {
    t.equal(res.toString('utf8'), '"foo \\"bar\\" baz"')
  }))
  rummage({
    str: 'foo "bar" baz',
    str2: { _string: 'foo "bar" baz' },
    num: 0,
    bool: true,
    date: new Date(2017, 0, 1),
    fn: function () {},
    null: null,
    skip_undef: undefined,
    arr: ['foo', 'bar', 'baz', null, function () {}],
    obj: {
      foo: {
        foo: 'foo "bar" baz',
        bar: ['foo', 'bar', 'baz'],
        baz: [{ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }]
      }
    },
    json: '{"foo":"foo","bar":"bar","baz":"baz"}',
    json2: { _json: '{"foo":"foo","bar":"bar","baz":"baz"}' },
    to_json: {
      foo: 'bar',
      toJSON: function () {
        return 'foo "bar" baz'
      }
    },
    str_stream: string(),
    str_stream2: { _string: string() },
    arr_stream: { _array: array() },
    arr_complex_stream: { _array: complexArray() },
    obj_stream: { _object: object() },
    obj_complex_stream: { _object: complexObject() },
    json_stream: { _json: json() }
  }).pipe(concat(function (res) {
    t.deepEqual(JSON.parse(res.toString('utf8')), {
      str: 'foo "bar" baz',
      str2: 'foo "bar" baz',
      num: 0,
      bool: true,
      date: '2017-01-01T00:00:00.000Z',
      null: null,
      arr: ['foo', 'bar', 'baz', null, null],
      obj: {
        foo: {
          foo: 'foo "bar" baz',
          bar: ['foo', 'bar', 'baz'],
          baz: [{ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }]
        }
      },
      json: '{"foo":"foo","bar":"bar","baz":"baz"}',
      json2: {
        foo: 'foo',
        bar: 'bar',
        baz: 'baz'
      },
      to_json: 'foo "bar" baz',
      str_stream: 'foo "bar" baz',
      str_stream2: 'foo "bar" baz',
      arr_stream: ['foo', 'bar', 'baz', null],
      arr_complex_stream: [
        ['foo', 'bar', 'baz', null],
        {
          foo: 'foo',
          bar: 'bar',
          baz: 'baz'
        },
        'foo "bar" baz',
        {
          foo: 'foo',
          bar: 'bar',
          baz: 'baz'
        }
      ],
      obj_stream: {
        foo: 'foo',
        bar: 'bar',
        baz: 'baz'
      },
      obj_complex_stream: {
        arr_stream: ['foo', 'bar', 'baz', null],
        obj_stream: {
          foo: 'foo',
          bar: 'bar',
          baz: 'baz'
        },
        str_stream: 'foo "bar" baz',
        json_stream: {
          foo: 'foo',
          bar: 'bar',
          baz: 'baz'
        }
      },
      json_stream: {
        foo: 'foo',
        bar: 'bar',
        baz: 'baz'
      }
    })
  }))
})

function array () {
  var rs = from.obj()
  rs.push('foo')
  rs.push('bar')
  rs.push('baz')
  rs.push(function () {})
  rs.push(null)
  return rs
}

function complexArray () {
  var rs = from.obj()
  rs.push({ _array: array() })
  rs.push({ _object: object() })
  rs.push({ _string: string() })
  rs.push({ _json: json() })
  rs.push(null)
  return rs
}

function object () {
  var rs = from.obj()
  rs.push(['foo', 'foo'])
  rs.push(['bar', 'bar'])
  rs.push(['baz', 'baz'])
  rs.push(['fn', function () {}])
  rs.push(null)
  return rs
}

function complexObject () {
  var rs = from.obj()
  rs.push(['arr_stream', { _array: array() }])
  rs.push(['obj_stream', { _object: object() }])
  rs.push(['str_stream', { _string: string() }])
  rs.push(['json_stream', { _json: json() }])
  rs.push(null)
  return rs
}

function string () {
  var rs = from.obj()
  rs.push('foo ')
  rs.push('"bar" ')
  rs.push('baz')
  rs.push(null)
  return rs
}

function json () {
  var rs = from.obj()
  rs.push('{"foo":"foo","bar":"bar","baz":"baz"}')
  rs.push(null)
  return rs
}

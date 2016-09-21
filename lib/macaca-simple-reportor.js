'use strict';

const fs = require('fs');
const path = require('path');
const EOL = require('os').EOL;
const mocha = require('mocha');
const _ = require('macaca-utils');
const inherits = require('util').inherits;

const Base = mocha.reporters.Base
const color = Base.color;

function Reporter(runner) {
  Base.call(this, runner);

  const that = this;
  const SEP_TOKEN = '|';

  let indents = 0;
  let n = 0;
  let resultLog = '';

  function indent() {
    return Array(indents).join('  ');
  }

  runner.on('start', function() {
    console.log();
  });

  runner.on('suite', function(suite) {
    ++indents;
    console.log(color('suite', '%s%s'), indent(), suite.title);

    if (suite.root) {
      const filename = suite.suites[0].file;
      const filepath = path.basename(filename, '.test.js');
      const reportDir = path.join(process.cwd(), 'macaca-logs', filepath);
      _.mkdir(reportDir);
      _.mkdir(path.join(reportDir, 'screenshot'));
      resultLog = path.join(reportDir, 'result.log');
      fs.writeFileSync(resultLog, '');
    }
  });

  runner.on('suite end', function() {
    --indents;
    if (indents === 1) {
      console.log();
    }
  });

  runner.on('pending', function(test) {
    const fmt = indent() + color('pending', '  - %s');
    console.log(fmt, test.title);
  });

  runner.on('pass', function(test) {
    let fmt;

    if (test.speed === 'fast') {
      fmt = indent()
        + color('checkmark', '  ' + Base.symbols.ok)
        + color('pass', ' %s');
      console.log(fmt, test.title);
    } else {
      fmt = indent()
        + color('checkmark', '  ' + Base.symbols.ok)
        + color('pass', ' %s')
        + color(test.speed, ' (%dms)');
      console.log(fmt, test.title, test.duration);
    }

    fs.appendFileSync(resultLog, `${test.title}${SEP_TOKEN}true${EOL}`);
  });

  runner.on('fail', function(test, err) {
    console.log(indent() + color('fail', '  %d) %s'), ++n, test.title);
    fs.appendFileSync(resultLog, `${test.title}${SEP_TOKEN}false${SEP_TOKEN}${err.message.replace(/(?:\r\n|\r|\n)/g, ' ')}${EOL}`);
  });

  runner.on('end', that.epilogue.bind(that));
};

inherits(Reporter, Base);

module.exports = Reporter;

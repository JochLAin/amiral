#!/usr/bin/env node
'use strict';

const program = require('commander');
const path = require('path');
const { version } = require(path.resolve(__dirname, '..', 'package.json'));
const Amiral = require('../index');

Amiral.configure({
    name: 'run',
    description: 'Echo some text',
    fields: [{
        name: 'value',
        label: 'What say',
        shortcut: 'v',
        required: false,
        argument: true,
    }],
}).then((props) => {
    require('child_process').spawn('echo', ['-f', props.file, `"${props.value}"`], {
        stdio: 'inherit',
    });
});

program.version(version, '-v, --version').parse(process.argv);

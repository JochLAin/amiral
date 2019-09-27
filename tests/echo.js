#!/usr/bin/env node
'use strict';

const program = require('commander');
const path = require('path');
const { version } = require(path.resolve(__dirname, '..', 'package.json'));
const Amiral = require('../index');

Amiral.create({
    name: 'run',
    description: 'Echo some text',
    fields: [{
        name: 'content',
        label: 'What say',
        shortcut: 'c',
        required: false,
        argument: true,
    }],
}).then((props) => {
    require('child_process').spawn('echo', ['-f', props.file, `"${props.content}"`], {
        stdio: 'inherit',
    });
});

program.version(version, '-v, --version').parse(process.argv);

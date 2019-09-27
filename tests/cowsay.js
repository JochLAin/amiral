#!/usr/bin/env node
'use strict';

const program = require('commander');
const path = require('path');
const { version } = require(path.resolve(__dirname, '..', 'package.json'));
const Amiral = require('../index');

Amiral.create({
    name: 'run',
    description: 'Cow say some text',
    fields: [{
        name: 'content',
        label: 'What say the cow',
        shortcut: 'c',
        required: false,
        argument: true,
    }, {
        name: 'file',
        label: 'Cowfile name',
        shortcut: 'f',
        required: false,
        default: 'tux',
    }],
}).then((props) => {
    require('child_process').spawn('cowsay', ['-f', props.file, `"${props.content}"`], {
        stdio: 'inherit',
    });
});

program.version(version, '-v, --version').parse(process.argv);

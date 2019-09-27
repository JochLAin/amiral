#!/usr/bin/env node
'use strict';

const child_process = require('child_process');
const path = require('path');

const RESULT = `Usage: cowsay [options] [command]

Options:
  -v, --version               output the version number
  -h, --help                  output usage information

Commands:
  cowsay [options] [content]  Cow say some text
`;

let result = '';
const stdio = child_process.spawn('node', [path.resolve(__dirname, 'cowsay.js'), '--help']);
stdio.stdout.on('data', (data) => result += data);
stdio.stderr.on('data', (data) => console.error(data));
stdio.on('close', () => {
    if (result !== RESULT) {
        process.exit(1);
    }
});

const RESULT_COWSAY = `Usage: cowsay cowsay [options] [content]

Cow say some text

Options:
  --content <content>  What say the cow
  -f, --file <file>    Cowfile name
  -h, --help           output usage information
`;
let result_cowsay = '';
const stdio_cowsay = child_process.spawn('node', [path.resolve(__dirname, 'cowsay.js'), 'run', '--help']);
stdio_cowsay.stdout.on('data', (data) => result_cowsay += data);
stdio_cowsay.stderr.on('data', (data) => console.error(data));
stdio_cowsay.on('close', () => {
    if (result_cowsay !== RESULT_COWSAY) {
        process.exit(1);
    }
});

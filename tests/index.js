#!/usr/bin/env node
'use strict';

const child_process = require('child_process');
const path = require('path');

const RESULT = `Usage: echo [options] [command]

Options:
  -v, --version            output the version number
  -h, --help               output usage information

Commands:
  run [options] [content]  Echo some text
`;

let result = '';
const stdio = child_process.spawn('node', [path.resolve(__dirname, 'echo.js'), '--help']);
stdio.stdout.on('data', (data) => result += data);
stdio.stderr.on('data', (data) => console.error(data));
stdio.on('close', () => {
    if (result !== RESULT) {
        process.exit(1);
    }
});

const RESULT_COWSAY = `Usage: echo run [options] [content]

Echo some text

Options:
  -c, --content <content>  What say
  -h, --help               output usage information
`;
let result_echo = '';
const stdio_echo = child_process.spawn('node', [path.resolve(__dirname, 'echo.js'), 'run', '--help']);
stdio_echo.stdout.on('data', (data) => result_echo += data);
stdio_echo.stderr.on('data', (data) => console.error(data));
stdio_echo.on('close', () => {
    if (result_echo !== RESULT_COWSAY) {
        process.exit(1);
    }
});

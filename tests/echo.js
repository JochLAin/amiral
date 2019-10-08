#!/usr/bin/env node
'use strict';

const Amiral = require('../index');

Amiral.configure({
    name: 'hello',
    description: 'Say hello',
    version: '0.0.0',
    fields: [
        { name: 'world', label: 'Say hello to world', type: Boolean, default: true },
        { name: 'uppercase', label: 'Say hello with uppercase', shortcut: 'u', type: Boolean },
        { name: 'lowercase', label: 'Say hello with lowercase', shortcut: 'l', type: Boolean },
    ],
    commands: [{
        name: 'to',
        description: 'Say hello to someone',
        fields: [
            { name: 'name', label: 'Say hello to', argument: true },
        ]
    }]
}).then((command) => {
    console.log(command.name);
    command.prompt().then((props) => {
        console.log(props);
    });
}).catch(error => {
    throw error;
});

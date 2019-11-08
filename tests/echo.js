#!/usr/bin/env node
'use strict';

const crieur = require('crieur');
const Sergent = require('../index');

Sergent.run({
    name: 'hello',
    description: 'Say hello',
    version: '0.0.0',
    fields: [
        { name: 'name', label: 'Say hello to', argument: true },
        { name: 'world', label: 'Say hello to world', type: Boolean, default: true },
        { name: 'upper', label: 'Say hello with uppercase', shortcut: 'u', type: Boolean, asked: true, default: false },
        { name: 'lower', label: 'Say hello with lowercase', shortcut: 'l', type: Boolean, asked: true, default: false },
    ],
    commands: [{
        name: 'to',
        description: 'Say hello to someone',
        fields: [
            { name: 'name', label: 'Say hello to', argument: true, asked: true },
        ],
        action: (command) => {
            const props = command.parse();
            const value = props.name;
            console.log(`Hello ${value}`);
        }
    }]
}).then((command) => {
    const props = command.parse();
    let value = props.name || (props.world ? 'World' : 'You');
    if (props.upper) value = value.toUpperCase();
    if (props.lower) value = value.toLowerCase();
    console.log(`Hello ${value}`);
}).catch(error => {
    crieur.error(error);
});

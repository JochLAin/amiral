#!/usr/bin/env node
'use strict';

const crieur = require('crieur');
const Sergent = require('../index');

Sergent.run({
    name: 'hello',
    description: 'Say hello',
    version: '0.0.0',
    fields: [
        { name: 'world', label: 'Say hello to world', type: Boolean, default: true },
        { name: 'upper', label: 'Say hello with uppercase', shortcut: 'u', type: Boolean },
        { name: 'lower', label: 'Say hello with lowercase', shortcut: 'l', type: Boolean },
    ],
    commands: [{
        name: 'to',
        description: 'Say hello to someone',
        fields: [
            { name: 'name', label: 'Say hello to', argument: true, required: true },
        ]
    }]
}).then((command) => {
    const props = command.parse();
    console.log(props);
    let value = props.name || (props.world ? 'world' : 'you');
    if (props.upper) value = value.toUpperCase();
    if (props.lower) value = value.toLowerCase();

    console.log(`Hello ${value}`);
}).catch(error => {
    crieur.error(error);
});

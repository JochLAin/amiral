# Amiral

## Command line tool

### Installation

`npm i -S amiral`

#### Dependencies

- [Chalk](https://www.npmjs.com/package/chalk)
- [Commander](https://www.npmjs.com/package/commander)
- [Fractale](https://www.npmjs.com/package/fractale)
- [Inquirer](https://www.npmjs.com/package/inquirer)

### Usage

```javascript
// my_module/bin/index.js
'use strict';

const Amiral = require('amiral');
const program = require('commander');
const path = require('path');
const { version } = require(path.resolve(__dirname, '..', 'package.json'));

const child_process = require('child_process');

Amiral.create({
    name: 'cowsay',
    description: 'Cow say some text',
    fields: [{
        name: 'content',
        label: 'What say the cow',
        required: false,
        argument: true,
    }, {
        name: 'file',
        label: 'What kind of cow',
        required: false,
        default: 'tux',
    }],
}).then((props) => {
    return child_process.spawn('cowsay', ['-f', props.file, props.content], { stdio: 'inherit' });
});

program.version(version, '-v, --version').parse(process.argv);
```

#### Schema

##### Command

```javascript
const CommandSchema = {
    name: String,               // Command name used to be called in cli
    description: String,        // Command description used in help message
    help: String,               // Help message showing after command usage and options
    fields: [Field],            // Property that can be passed to command or prompted
}
```

##### Field

```javascript
const FieldSchema = {
    label: String,              // Label used in question and field description
    name: String,               // Name of the field
    type: undefined,            // Specify the field type (Boolean, Number, String, Object, Array, Map)
    required: Boolean,          // Specify if the field is required
    default: undefined,         // Default value
    value: undefined,           // Stored value (filled automatically)
    children: [Fractale.SELF],  // Children 

    // Command specific
    shortcut: String,           // Command shortcut
    argument: Boolean,          // Specify if field is command argument

    // Question specific
    question: String,           // Inquirer question type
    message: String,            // Override label for question
    pageSize: Number,
    prefix: String,
    suffix: String,
    choices: undefined,
    filter: undefined,
    transformer: undefined,
    validate: undefined,
    when: undefined,
}
```

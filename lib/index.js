const Fractale = require('fractale');
const program = require('commander');
const inquirer = require('inquirer');
const logger = require('./logger');

const Field = module.exports.Field = Fractale.create('Amiral_Command_Field', {
    label: String,
    name: String,
    type: undefined,
    required: Boolean,
    default: undefined,
    value: undefined,
    children: [Fractale.SELF],

    shortcut: String,
    argument: Boolean,

    question: String,
    message: String,
    pageSize: Number,
    prefix: String,
    suffix: String,
    choices: undefined,
    filter: undefined,
    transformer: undefined,
    validate: undefined,
    when: undefined,
});

Field.prototype.getQuestion = function (answers = {}) {
    return {
        name: this.name || undefined,
        type: this.question || undefined,
        message: this.message || this.label || undefined,
        default: this.value || this.default || undefined,
        choices: this.choices || undefined,
        filter: this.filter || undefined,
        validate: this.validate || undefined,
        transformer: this.transformer || undefined,
        when: this.when && (() => this.when(answers)) || undefined,
        pageSize: this.pageSize || undefined,
        prefix: this.prefix || undefined,
        suffix: this.suffix || undefined,
    };
};

const Command = module.exports.Command = Fractale.create('Amiral_Command', {
    name: String,
    description: String,
    help: String,
    fields: [Field],
});

Command.prototype.configure = function () {
    return new Promise((resolve) => {
        const cmd = program
            .command(this.name)
            .description(this.description)
            .arguments(this.getCommandLineArguments())
        ;

        this.getCommandLineOptions().forEach(({ usage, label }) => cmd.option(usage, label));

        if (this.help) {
            cmd.on('--help', () => {
                console.log('');
                this.help.split('\n').forEach(line => {
                    console.log(line);
                });
            });
        }

        cmd.action((...args) => {
            this.fill(cmd, args.slice(0, -1));
            resolve();
        });
    }).then(() => {
        return this.prompt();
    }).catch((error) => {
        logger.error(error);
        process.exit(1);
    });
};

Command.prototype.fill = function (options, args) {
    const indexes = this.fields.map((field, index) => field.argument ? index : undefined).filter(index => index !== undefined);
    [].forEach.call(args, (value, index) => {
        this.fields[indexes[index]].value = value;
    });
    this.fields.forEach((field) => {
        if (options[field.name] !== undefined) {
            field.value = options[field.name];
        }
    });
};

Command.prototype.getCommandLineArguments = function () {
    let usage = '';
    for (let index in this.fields) {
        if (this.fields[index].argument) {
            usage += ` [${this.fields[index].name}]`;
        }
    }
    return usage;
};

Command.prototype.getCommandLineOptions = function () {
    const closure = (values, prefix = '') => {
        return values.reduce((accu, value) => {
            if (['collection', 'array'].includes(value.type)) {
                return accu;
            } else if (value.children.length) {
                return accu.concat(closure(value.children, `${prefix}${value.name}-`));
            }

            let usage = '';
            if (value.shortcut) usage += `-${value.shortcut}, `;
            usage += `--${prefix}${value.name}`;
            if (value.type !== 'boolean') {
                usage += ` <${value.name}>`;
            }

            return accu.concat({ label: value.label, usage });
        }, []);
    };

    return closure(this.fields);
};

Command.prototype.parse = function () {
    const _parse = (values) => {
        return values.reduce((accu, value) => {
            if (value.children.length) {
                if (['collection', 'array'].includes(value.type)) {
                    return Object.assign({}, accu, {
                        [value.name]: (value.value || []).map(_parse)
                    });
                }
                return Object.assign({}, accu, _parse(value.children));
            }

            return Object.assign({}, accu, { [value.name]: value.value });
        }, {});
    };

    return _parse(this.fields);
};

Command.prototype.prompt = function () {
    const loop = (values) => {
        let chain = Promise.resolve();
        for (const index in values) {
            chain = chain.then(one(values[index]));
        }
        return chain;
    };

    const one = (value) => () => {
        if (value.children.length) {
            if (['collection', 'array'].includes(value.type)) {
                return recursive(value);
            }
            return loop(value.children);
        } else if (!['collection', 'array'].includes(value.type)) {
            const question = value.getQuestion(this.parse());
            return inquirer.prompt([question]).then((answers) => {
                value.value = answers[question.name];
            });
        }
    };

    const recursive = (value, index = 0) => {
        return inquirer.prompt([{
            type: 'confirm',
            name: 'continue',
            message: `Do you wanna add a ${index ? 'new ' : ''}${value.singular || 'entry'}`,
            default: false
        }]).then((answers)  => {
            if (answers.continue) {
                return loop(value.children).then(() => {
                    if (!value.value) value.value = [];

                    value.value.push(value.children.map((child) => {
                        const value = new Field(child);
                        child.value = undefined;
                        return value;
                    }));
                    return recursive(value);
                });
            }
        });
    };

    return loop(this.fields).then(() => {
        return this.parse();
    });
};

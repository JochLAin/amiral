const Fractale = require('fractale');
const program = require('commander');
const inquirer = require('inquirer');
const logger = require('./logger');

const midf = (elem, ...props) => elem instanceof Function ? elem(...props) : elem;

const Field = module.exports.Field = Fractale.create('Amiral_Command_Field', {
    label: String,
    name: String,
    type: undefined,
    required: Boolean,
    default: null,
    value: null,
    children: [Fractale.SELF],

    shortcut: String,
    argument: Boolean,

    question: null,
    message: null,
    pageSize: null,
    prefix: null,
    suffix: null,
    choices: null,
    filter: null,
    transformer: null,
    validate: null,
    when: null,
});

Field.prototype.getQuestion = function (answers = {}) {
    let type = this.question;
    if (this.type === Boolean && !type) {
        type = 'confirm';
    }

    const question = {
        name: this.name,
        type: midf(type, answers),
        message: this.message || midf(this.label, answers),
        default: this.value || midf(this.default, answers),
        choices: midf(this.choices, answers),
        filter: midf(this.filter, answers),
        transformer: midf(this.transformer, answers),
        validate: midf(this.validate, answers),
        when: midf(this.when, answers),
        pageSize: midf(this.pageSize, answers),
        prefix: midf(this.prefix, answers),
        suffix: midf(this.suffix, answers),
    };

    return Object.keys(question).reduce((accu, key) => {
        let value = question[key];
        if (value === null) value = undefined;
        return Object.assign({}, accu, { [key]: value });
    }, {});
};

const Command = module.exports.Command = Fractale.create('Amiral_Command', {
    name: String,
    description: String,
    help: String,
    master: Boolean,
    fields: [Field],
});

Command.prototype.configure = function () {
    return new Promise((resolve) => {
        const cmd = this.master ? program.name(this.name) : program.command(this.name);
        cmd.description(this.description)
            .arguments(this.getCommandLineArguments())
        ;

        this.getCommandLineOptions().forEach(({ usage, label }) => {
            cmd.option(usage, label);
        });

        if (this.help) {
            cmd.on('--help', () => {
                console.log('');
                this.help.split('\n').forEach(line => {
                    console.log(line);
                });
            });
        }

        cmd.action((...args) => {
            const options = this.getCommandLineOptions().filter((option) => {
                return ['boolean', 'number', 'string'].includes(typeof cmd[option.key]);
            }).reduce((accu, option) => {
                return Object.assign({}, accu, {
                    [option.key]: cmd[option.key],
                });
            }, {});
            this.fill(options, args.slice(0, -1));
            resolve();
        });
    }).then(() => {
        return this.prompt();
    }).catch((error) => {
        logger.error(error);
        process.exit(1);
    });
};

Command.prototype.fill = function (options, arguments) {
    const indexes = this.fields.map((field, index) => field.argument ? index : undefined).filter(index => index !== undefined);
    arguments.forEach( (value, index) => {
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
    const closure = (fields, prefix = '') => {
        return fields.reduce((accu, field) => {
            if ([Array].includes(field.type)) {
                return accu;
            } else if (field.children.length) {
                return accu.concat(closure(field.children, `${prefix}${field.name}-`));
            }

            const key = `${prefix}${field.name}`;
            let usage = '';
            if (field.shortcut) usage += `-${field.shortcut}, `;
            usage += `--${key}`;
            if (field.type !== Boolean) {
                usage += ` <${field.name}>`;
            }

            return accu.concat({ label: field.label, usage, key });
        }, []);
    };

    return closure(this.fields);
};

Command.prototype.parse = function () {
    const _parse = (fields) => {
        return fields.reduce((accu, field) => {
            if (field.children.length) {
                if (field.type === Map) {
                    return Object.assign({}, accu, {
                        [field.name]: (field.value || []).map(_parse)
                    });
                } else if (field.type === Array) {
                    return Object.assign({}, accu, {
                        [field.name]: (field.value || []).map((child) => child[0].value)
                    });
                }
                return Object.assign({}, accu, _parse(field.children));
            }
            return Object.assign({}, accu, { [field.name]: field.value });
        }, {});
    };

    return _parse(this.fields);
};

Command.prototype.prompt = function () {
    const loop = (fields) => {
        let chain = Promise.resolve();
        for (const index in fields) {
            chain = chain.then(one(fields[index]));
        }
        return chain;
    };

    const one = (field) => () => {
        if (field.children.length) {
            if ([Array, Map].includes(field.type)) {
                return recursive(field);
            }
            return loop(field.children);
        } else if (field.value) {
            return Promise.resolve();
        } else if (![Array, Map].includes(field.type)) {
            const question = field.getQuestion(this.parse());
            return inquirer.prompt([question]).then((answers) => {
                field.value = answers[question.name];
            });
        }
    };

    const recursive = (field, index = 0) => {
        return inquirer.prompt([{
            type: 'confirm',
            name: 'continue',
            message: `Do you wanna add ${index ? 'a new ' : ''}${field.singular || 'an entry'}`,
            default: false
        }]).then((answers)  => {
            if (answers.continue) {
                return loop(field.children).then(() => {
                    if (!field.value) field.value = [];

                    field.value.push(field.children.map((child) => {
                        const field = new Field(child);
                        child.field = undefined;
                        return field;
                    }));
                    return recursive(field);
                });
            }
        });
    };

    return loop(this.fields).then(() => {
        return this.parse();
    });
};

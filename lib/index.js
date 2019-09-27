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

Command.prototype.fill = function (options, arguments) {
    const indexes = this.fields.map((field, index) => field.argument ? index : undefined).filter(index => index !== undefined);
    [].forEach.call(arguments, (value, index) => {
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
            if (['collection', 'array'].includes(field.type)) {
                return accu;
            } else if (field.children.length) {
                return accu.concat(closure(field.children, `${prefix}${field.name}-`));
            }

            let usage = '';
            if (field.shortcut) usage += `-${field.shortcut}, `;
            usage += `--${prefix}${field.name}`;
            if (field.type !== 'boolean') {
                usage += ` <${field.name}>`;
            }

            return accu.concat({ label: field.label, usage });
        }, []);
    };

    return closure(this.fields);
};

Command.prototype.parse = function () {
    const _parse = (fields) => {
        return fields.reduce((accu, field) => {
            if (field.children.length) {
                if (['collection', 'array'].includes(field.type)) {
                    return Object.assign({}, accu, {
                        [field.name]: (field.value || []).map(_parse)
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
            if (['collection', 'array'].includes(field.type)) {
                return recursive(field);
            }
            return loop(field.children);
        } else if (!['collection', 'array'].includes(field.type)) {
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

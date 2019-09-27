const Fractale = require('fractale');
const program = require('commander');
const inquirer = require('inquirer');
const logger = require('./logger');

const Value = Fractale.create('Amiral_Command_Value', {
    label: String,
    name: String,
    type: String,
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

Value.prototype.getQuestion = function (answers = {}) {
    return {
        name: this.name || undefined,
        type: this.question || undefined,
        message: this.message || this.label || undefined,
        default: this.default || undefined,
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
    options: [Value],
});

Command.prototype.configure = function () {
    return new Promise((resolve) => {
        const cmd = program
            .command(`${this.name}${this.getCommandLineArguments()}`)
            .description(this.description)
        ;

        this.getCommandLineOptions().forEach(({ usage, label }) => cmd.option(usage, label));

        cmd.action((...args) => {
            this.fillArgumentsWithCommandLine(args.slice(0, -1));
            this.fillOptionsWithCommandLine(cmd);
            resolve();
        });
    }).then(() => {
        return this.prompt();
    }).catch((error) => {
        logger.error(error);
        process.exit(1);
    });
};

Command.prototype.fillArgumentsWithCommandLine = function () {
    [].forEach.call(arguments, (value, index) => {
        this.options.filter(opt => opt.argument)[index].value = value;
    });
};

Command.prototype.fillOptionsWithCommandLine = function (props) {
    this.options.forEach((option) => {
        if (props[option.name] !== undefined) {
            option.value = props[option.name];
        }
    });
};

Command.prototype.getCommandLineArguments = function () {
    let usage = '';
    for (let index in this.options) {
        if (this.options[index].argument) {
            usage += ` [${this.options[index].name}]`;
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

    return closure(this.options);
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

    return _parse(this.options);
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
                        const value = new Value(child);
                        child.value = undefined;
                        return value;
                    }));
                    return recursive(value);
                });
            }
        });
    };

    return loop(this.options).then(() => {
        return this.parse();
    });
};

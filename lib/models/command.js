const program = require('caporal');
const Fractale = require('fractale');
const Field = require('./field');

const Command = module.exports = Fractale.create('Sergent_Command', {
    name: String,
    alias: String,
    description: String,
    help: String,
    fields: [Field],
    action: undefined,
});

Command.prototype.configure = function () {
    return new Promise((resolve) => {
        const cmd = program.command(this.name, this.description);
        if (this.alias) cmd.alias(this.alias);
        if (this.help) cmd.help(this.help);

        this.fields.filter(field => field.argument).forEach((field) => {
            cmd.argument(
                field.required ? `<${field.name}>` : `[${field.name}]`,
                field.label,
                field.validator,
                field.default
            );
        });

        this.fields.filter(field => !(field.argument && field.required)).forEach((field) => {
            cmd.option(
                `--${field.name} ${field.required ? `<${field.name}>` : `[${field.name}]`}`,
                field.label,
                field.validator,
                field.default
            );
        });

        cmd.action((args, options) => {
            this.fill(args, options);
            resolve(this);
        });
    });
};

Command.prototype.run = function () {
    return this.configure().then(() => {
        return this.prompt().then(() => {
            if (this.action) {
                return this.action(this);
            } else {
                return this;
            }
        });
    });
};

Command.prototype.fill = function (arguments, options) {
    for (const index in this.fields) {
        const field = this.fields[index];
        if (arguments[field.name]) {
            field.value = arguments[field.name];
        } else if (options[field.name]) {
            field.value = options[field.name];
        }
    }
};

Command.prototype.parse = function () {
    return this.fields.reduce((accu, field) => {
        return Object.assign({}, accu, {
            [field.name]: field.value
        });
    }, {});
};

Command.prototype.prompt = function () {
    let chain = Promise.resolve();
    for (const index in this.fields) {
        chain = chain.then(() => {
            return this.fields[index].prompt(this.parse());
        });
    }
    return chain;
};

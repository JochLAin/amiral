const program = require('caporal');
const Fractale = require('fractale');
const Command = require('./command');

const Program = module.exports = Fractale.create('Program', Command, {
    version: String,
    commands: [Command],
});

Program.prototype.run = function () {
    return new Promise((resolve) => {
        program.description(this.description);
        if (this.version) program.version(this.version);

        this.fields.filter(field => field.argument).forEach((field) => {
            program.argument(
                field.required ? `<${field.name}>` : `[${field.name}]`,
                field.label,
                field.validator,
                field.default
            );
        });

        this.fields.filter(field => !(field.argument && field.required)).forEach((field) => {
            program.option(
                `--${field.name} ${field.required ? `<${field.name}>` : `[${field.name}]`}`,
                field.label,
                field.validator,
                field.default
            );
        });

        this.commands.forEach((command) => {
            command.configure().then(() => {
                command.prompt().then(() => {
                    if (command.action) {
                        resolve(command.action.call(command, command));
                    } else {
                        resolve(command);
                    }
                });
            });
        });

        program.action((args, options) => {
            this.fill(args, options);
            this.prompt().then(() => {
                if (this.action) {
                    resolve(this.action.call(this, this));
                } else {
                    resolve(this);
                }
            });
        });

        program.parse(process.argv);
    });
};

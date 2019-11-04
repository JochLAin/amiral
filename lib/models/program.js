const program = require('caporal');
const Fractale = require('fractale');
const Command = require('./command');

const Program = module.exports = Fractale.create('Program', Command, {
    version: String,
    commands: [Command],
});

Program.prototype.configure = function () {
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
            command.run().then(() => {
                return resolve(command);
            });
        });

        program.action((args, options) => {
            this.fill(args, options);
            resolve(this);
        });

        program.parse(process.argv);
    });
};

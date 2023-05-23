const path = require('path')

BigInt.prototype.toJSON = function () {
    const int = Number.parseInt(this.toString());
    return int || this.toString();
};

/** @type {import('next').NextConfig} */
const withTM = require("next-transpile-modules")([
    "@fullcalendar/common",
    "@fullcalendar/common",
    "@fullcalendar/daygrid",
    "@fullcalendar/interaction",
    "@fullcalendar/react",
    "@fullcalendar/timegrid",
  ]);
  

let config = withTM(
    {
        sassOptions: {
            includePaths: [path.join(__dirname, 'assets/stylesheets')]
        }
    }
);

config.webpack = (config) => {
    config.experiments = {  ...config.experiments, topLevelAwait: true };
    return config;
}

module.exports = config;

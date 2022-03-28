const path = require('path')

BigInt.prototype.toJSON = function () {
    const int = Number.parseInt(this.toString());
    return int ?? this.toString();
};


module.exports = {
    sassOptions: {
        includePaths: [path.join(__dirname, 'assets/stylesheets')]
    }
}
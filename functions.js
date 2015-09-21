var exports = {};
exports.stripWhiteSpaceAndNewLines = function (toStrip) {
	return toStrip.replace(/(\r\n|\n|\r)/gm,"").trim();
}

module.exports = exports;
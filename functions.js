var toExport = {};
toExport.stripWhiteSpaceAndNewLines = function (toStrip) {
	return toStrip.replace(/(\r\n|\n|\r)/gm,"").trim();
}

module.exports = toExport;
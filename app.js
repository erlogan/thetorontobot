var moment = require('moment-timezone');
var fs = require('fs');
var dailyOverview = require('./dailyoverview.js');

var today = moment().tz("America/Toronto");
var yesterday;

var redditPollingLoop = function () {
	var utcDate = fs.readFileSync("yesterday", "utf-8");
	yesterday = moment.utc(moment.unix(utcDate)).tz("America/Toronto");
	if (today.isAfter(yesterday.tz("America/Toronto"), 'day'))
		dailyOverview();
	else
		console.log('Not next day. Waiting 5min.');
	setTimeout(redditPollingLoop, 1000 * 60 * 5); //5min
};

redditPollingLoop();
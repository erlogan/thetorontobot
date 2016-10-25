var moment = require('moment-timezone');
var fs = require('fs');
var dailyOverview = require('./dailyoverview.js');
var sidebarUpdate = require('./sidebar.js');
var functions = require('./functions.js');

var today;
var yesterday;

var redditPollingLoop = function () {
	today = moment().tz("America/Toronto");
	var utcDate = fs.readFileSync("yesterday", "utf-8");
	yesterday = moment.utc(moment.unix(functions.stripWhiteSpaceAndNewLines(utcDate))).tz("America/Toronto");
    sidebarUpdate();
	if (today.isAfter(yesterday.tz("America/Toronto"), 'day')){
		dailyOverview();
		console.log(moment.tz("America/Toronto").format() +  ': New Post Made!');
	}
	else
		console.log(moment.tz("America/Toronto").format() +  ': Not next day. Waiting 5min. - Yesterday: ' + yesterday.format() + ' Today: ' + today.format());
	setTimeout(redditPollingLoop, 1000 * 60 * 15); //15min
};

redditPollingLoop();

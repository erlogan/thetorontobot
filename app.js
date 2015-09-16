var Snoocore = require('snoocore');
var moment = require('moment-timezone');
var async = require('async');
var fs = require('fs');
var config = require('./config.js');

var yesterday = moment().tz("America/Toronto").subtract(1, 'days');
var subreddits = [];
var latestPosts = {};
var posts = [];
var post = { //structure laid out for my own reference - not necessary
	title: "",
	url: "",
	author: "",
	comments: 0,
	date_utc: 0,
};
var postBody = "";
var newLine = "\r\n";
var tableHeader = "Post Title | Author | Comments";
tableHeader += newLine + ":---|:--:|---:";
var postTitle = "Daily Sister Subreddit Overview for " + yesterday.tz("America/Toronto").format("MMM Do YYYY");


var generatePostTable = function (subreddit, posts) {
	var postText = "";

	postText += "## /r/" + subreddit;
	postText += newLine + tableHeader;

	posts.forEach(function (post) {
		postText += newLine;
		postText += "[" + post.title + "](" + post.url + ")";
		postText += " | /u/" + post.author + " | " + post.comments;
	});

	return postText;
};


var reddit = new Snoocore({
	userAgent: '/u/thetorontobot TheTorontoBot@0.0.1',
	oauth: {
		type: 'script',
		key: config.key,
		secret: config.secret,
		username: config.username,
		password: config.password,
		scope: ['identity', 'read', 'wikiread', 'submit', 'modposts']
	}
});

reddit('/r/toronto/wiki/thetorontobot/.json').get().then(function (response) {
	subreddits = response.data.content_md.split('\r\n\r\n');
}).then(function () {
	async.series(
		[
			function (callback) {
				async.eachSeries(subreddits, function (subreddit, next) {
					reddit('/r/' + subreddit + '/new/.json').get().then(function (response) {
						response.data.children.every(function (child) {
							if (moment.utc(moment.unix(child.data.created_utc)).isBetween(moment.utc(yesterday.startOf('day')), moment.utc(yesterday.endOf('day')))) {
								post = {
									title: child.data.title,
									url: child.data.url,
									author: child.data.author,
									comments: child.data.num_comments,
									date_utc: moment.utc(moment.unix(child.data.created_utc)),
								}
								posts.push(post);
								return true;
							}
							else
								return false;
						});
						if (posts.length > 0)
							latestPosts[subreddit] = posts;
						posts = [];
						next();
					});
				}, function (err) {
					if (err)
						console.log('error: ' + err);
					else
						callback();
				});
			},
			function (callback) {
				for (var key in latestPosts) {
					if (latestPosts.hasOwnProperty(key)) {
						var obj = latestPosts[key];
						if (postBody.length > 0)
							postBody += newLine;
						postBody += generatePostTable(key, obj);
					}
				}
				callback();
			},
			function (callback) {
				var newPost = {
					"kind": "self",
					"sr": "toronto2",
					"text": postBody,
					"title": postTitle,
					"api_type": "json",
					"sendReplies": "false"
				}
				reddit('/api/submit').post(newPost).then(function (response) {
					if (response.json.errors.length > 0)
						console.log(response.json.errors);
					else {
						var newPostID = response.json.data.name;
						var prevPostID = "";
						prevPostID = fs.readFileSync("previd", "utf-8");
						
						reddit('/api/set_subreddit_sticky').post({ 'api_type': 'json', 'state': 'false', 'num': 2, 'id': prevPostID }).then(function () {
								reddit('/api/set_subreddit_sticky').post({ 'api_type': 'json', 'state': 'true', 'num': 2, 'id': newPostID }).then(
									function (response) {
										var stream = fs.createWriteStream("previd");
										stream.once('open', function (fd) {
											stream.write(newPostID);
											stream.end();
										});
									});
							});

					}
				});
				callback();
			}
		]
		);
});
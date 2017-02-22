var Snoocore = require('snoocore');
var moment = require('moment-timezone');
var async = require('async');
var fs = require('fs');
var config = require('./config.js');
var functions = require('./functions.js');

module.exports = function () {
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
	var postTitle = "Toronto Daily - " + moment().tz("America/Toronto").format("MMM Do YYYY");
	var postBeforeText = "#Welcome to the Toronto Daily Thread.";
	postBeforeText += newLine + newLine + "This thread serves two purposes:";
	postBeforeText += newLine + newLine + "**1)** To collect and make visible new posts in smaller Toronto based subreddits.";
	postBeforeText += newLine + newLine + "Feel free to visit, comment and be generally helpful in posts indexed below. Please also remember to stay on your best behaviour when travelling outside of /r/toronto.";
	postBeforeText += newLine + newLine + "------";
	postBeforeText += newLine + newLine + "**2)** To act as a general off-topic conversation hub for the day.";
	postBeforeText += newLine + newLine + "To that end, use this thread to talk about whatever is on your mind, regardless of whether or not it's related to Toronto.";
	postBeforeText += newLine + newLine + "No matter where you're posting, please remember to be excellent to each other.";
	postBeforeText += newLine + newLine + "-----";
	var postAfterText = "-----" + newLine + newLine + "*I am a bot, and this post was generated automatically. Please [contact the moderators of this subreddit](https://www.reddit.com/message/compose/?to=/r/toronto) if you have any questions or concerns.*";

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
					var postData = postBeforeText + newLine + newLine + postBody + newLine + newLine + postAfterText;
					var newPost = {
						"kind": "self",
						"sr": "toronto",
						"text": postData,
						"title": postTitle,
						"api_type": "json",
						"sendReplies": false
					}
					reddit('/api/submit').post(newPost).then(function (response) {
						if (response.json.errors.length > 0)
							console.log(response.json.errors);
						else {
							var newPostID = response.json.data.name;
							var prevPostID = "";
							prevPostID = fs.readFileSync("previd", "utf-8");
							reddit('/api/distinguish').post({ 'api_type': 'json', 'how': 'yes', 'id': newPostID }).then(function () {
                                reddit('/api/set_subreddit_sticky').post({ 'api_type': 'json', 'state': 'false', 'num': 2, 'id': functions.stripWhiteSpaceAndNewLines(newPostID) }).then(
                                    function (response) {
                                        var stream = fs.createWriteStream("previd");
                                        stream.once('open', function (fd) {
                                            stream.write(newPostID);
                                            stream.end();
                                        });
                                        
                                        var yesterstream = fs.createWriteStream("yesterday");
                                        yesterstream.once('open', function (fd) {
                                            yesterstream.write(moment.utc().format('X'));
                                            yesterstream.end();
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
}

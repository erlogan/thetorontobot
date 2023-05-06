var Snoocore = require('snoocore');
var config = require('./config.js');
var moment = require('moment-timezone');

module.exports = function () {
    var reddit = new Snoocore({
        userAgent: config.userAgent,
        oauth: {
            type: 'script',
        key: config.key,
        secret: config.secret,
        username: config.username,
        password: config.password,
        scope: ['read','modconfig']
        }
    });

    var generatePostTable = function (posts) {
        var postText = "";
        var newLine = "\r\n";

        posts.forEach(function (post) {
            postText += newLine;
            title = post.data.title.replace(/\$/,"$$$$")
            title = title.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
            postText += "1. [" + title + "](" + post.data.url + ")";
        });

        return postText + newLine;
    };

    reddit('/r/toronto/about/edit.json').get().then(function(result) {
        var data = result.data;

        // MUST specify these extra options.
        // unfortunately /about/edit.json does not provide all the
        // parameters for the /api/site_admin call

        data.api_type = 'json'; // must be the string 'json'

        // NEEDED ALIASES
        data.sr = data.subreddit_id; // add .sr alias for subreddit_id
        data.link_type = data.content_options; // add .link_type alias for content_options
        data.type = data.subreddit_type; // add .type alias for subreddit_type

        // Finally, make any actual changes needed
        reddit('/r/askTO/hot').listing({limit: 5}).then(
            function(slice){ 
                data.description = data.description.replace(/(\[\]\(\/questions-start\)\n)[\s\S]*?(\n\[\]\(\/questions-end\))/m,"$1"+generatePostTable(slice.children)+"$2");
                data.description = data.description.replace(/amp;/g,""); // workaround -- telling snoocore not to decode entities doesn't work apparently
                //data.description = data.description.replace(/[\u2018\u2019]/g, "'") .replace(/[\u201C\u201D]/g, '"');
                console.log(moment().tz("America/Toronto").format() + ": Updating sidebar with: ");
                console.log(generatePostTable(slice.children));
                reddit('/api/site_admin').post(data).then(function(result){console.log(result)});
                console.log("sidebar update complete");
                return;
            }
        );
    });
}

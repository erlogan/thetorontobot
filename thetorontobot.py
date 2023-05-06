import logging
import praw
import re
import schedule
import time

def main():
    reddit = praw.Reddit("thetorontobot", config_interpolation="basic")

    schedule.every(15).minutes.do(sidebar, reddit=reddit)
    schedule.every().day.at("00:00", "America/Toronto").do(dailypost, reddit=reddit)

    schedule.run_all()

    while True:
        schedule.run_pending()
        time.sleep(60)

def sidebar(reddit):
    sidebar = reddit.subreddit("toronto").wiki["config/sidebar"].content_md
    newtext = "\r\n"
    for submission in reddit.subreddit("askTO").hot(limit=7):
        if (submission.stickied):
            next
        else:
            title = submission.title
            # The usual text fixups
            #title.replace("$","$$")
            title.replace(u'\u2018',"'")
            title.replace(u'\u2019',"'")
            title.replace(u'\u201C','"')
            title.replace(u'\u201D','"')
            newtext += "1. [" + title + "](https://www.reddit.com" + submission.permalink + ")\r\n\r\n"
    sidebar = re.sub(r"(\[\]\(\/questions-start\)\n)[\s\S]*?(\n\[\]\(\/questions-end\))", "\g<1>"+newtext+"\g<2>", sidebar, flags=re.M)
    reddit.subreddit("toronto").wiki["config/sidebar"].edit(content=sidebar, reason="update with the latest from /r/askTO")
    logging.info('Sidebar updated with:\n'+newtext)

def dailypost(reddit):
    logging.info("Time to make the daily post")

if __name__ == '__main__':
    logging.basicConfig(format='[%(asctime)s]  %(message)s', datefmt='%Y-%m-%d %H:%M:%S %Z', level=logging.INFO)
    main()

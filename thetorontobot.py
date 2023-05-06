import praw
import re
import schedule
import time

import sys

def main():
    reddit = praw.Reddit("thetorontobot", config_interpolation="basic")

    schedule.every(1).seconds.do(sidebar, reddit=reddit)
    schedule.every().day.at("00:00", "America/Toronto").do(dailypost, reddit=reddit)
    while True:
        schedule.run_pending()
        time.sleep(1)

def sidebar(reddit):
    sidebar = reddit.subreddit("toronto2").wiki["config/sidebar"].content_md
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
    #print("New sidebar:")
    #print("@@@@@")
    #print(sidebar)
    #print("@@@@@")
    reddit.subreddit("toronto2").wiki["config/sidebar"].edit(content=sidebar, reason="update with the latest from /r/askTO")
    sys.exit(0)

def dailypost(reddit):
    print("Time to make the daily post")
    print("The time is" + time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()))

if __name__ == '__main__':
    main()

"use strict"
var fs = require('fs');
var util = require('util');
let https = require('https');
var express = require('express');
const puppeteer = require('puppeteer');
const random = require('random');
var CronJob = require('cron').CronJob;
let common = require('./methods/common');
let defaults = require('./defaults.json');
let delay = require('delay');
const date = require('date-and-time');
let colors = require('colors');
const commandLineArgs = require('command-line-args')

const optionDefinitions = [
	{name: 'user', alias: 'u', type: String, defaultOption: true},
	{name: 'password', alias: 'p', type: String},
	{name: 'headless', alias: 'h', type: Boolean},
	{name: 'closeBrowser', alias: 'c', type: Boolean}
]
const options = commandLineArgs(optionDefinitions)

let log_file;
let log_stdout;
let headlessMod = defaults.headlessS;
let isRunning = true;
let users = [];
let mostTrustedUsers = defaults.mostTrustedUsers;

const likePossibility = 12000;
const repostPossibility = 22000;
const commentPossibility = 1700000;
const likeNoThHigh = 100;
const likeNoThHighPos = 1.01;
const likeNoThLow = 10;
const likeNoThLowPos = 1.05;
const chanceForRepostReposters = 1.3; // Decrease
const chanceForPostReposters = 1.1; // Increase
const comUsersPos = 1.1;
const mostTrustedUserPos = 1.2;
let maxPageNotLoadCunter = 0;
let maxPageNotLoadTries = 20;
let userAgent = defaults.userAgent;
let username = defaults.username.toLowerCase();
let config;
let password;

try
{
	config = require(`./users/${username}/info.json`);
	password = config.password;
} catch (error)
{
	username = null;
	console.log('Default Username does not exist');
}
if (options.user)
{
	username = options.user.toLowerCase();
	config = require(`./users/${username}/info.json`);
	password = config.password;
}
if (options.password)
{
	password = options.password;
}
if (username == null)
{
	console.log('There is no default username, and you didnt pass a username also');
	process.exit(0);
}
if (options.closeBrowser)
{
	defaults.closeBrowser = true;
}
if (options.headless)
{
	headlessMod = options.headless;
}
if (config.userAgent != "")
{
	userAgent = config.userAgent;
}
if (defaults.logToFile)
{
	let logPath = `./users/${username}/likeout.log`;
	log_file = fs.createWriteStream(logPath, {flags: 'w'});
	log_stdout = process.stdout;
	console.log = function ()
	{
		log_file.write(util.format.apply(null, arguments) + '\n');
		log_stdout.write(util.format.apply(null, arguments) + '\n');
	}
	console.error = console.log;
}

let r = random.int(200, 400);
let noPostToReview = (config.postToReview || defaults.noPostToReview) + r;
let maxLoopTries = parseInt(noPostToReview / 3);

console.log(`${date.format(new Date(), 'YYYY/MM/DD HH:mm:ss')}\n`.yellow);
async function run()
{
	isRunning = true;
	users = common.getUsersList();
	users = users.filter(item => item !== username);
	let args =
		[
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-infobars',
			'--window-position=0,0',
			'--ignore-certifcate-errors',
			'--ignore-certifcate-errors-spki-list',
			`--user-agent=${userAgent}`
		];
	if (config.args != undefined && config.args != null && config.args.length > 0)
	{
		console.log('Adding args ...');
		args = [ ...args, ...config.args ];
	}
	if (config.useTor != undefined && config.useTor == true && defaults.useTor != false)
	{
		let ra = random.int(defaults.torRange[ 0 ], defaults.torRange[ 1 ]);
		args.push(`--proxy-server=socks5://127.0.0.1:90${ra}`);
		console.log('Using Tor on', `90${ra}`);
	}
	const options =
	{
		args,
		headless: headlessMod,
		// executablePath: "/usr/bin/google-chrome-stable",
		ignoreHTTPSErrors: true,
		userDataDir: `./users/${username}/chromData/`
	};
	const browser = await puppeteer.launch(options);
	const page = await browser.newPage();
	await page.evaluateOnNewDocument(common.preload);
	await page.setDefaultNavigationTimeout(50000);
	await page.setViewport(config.viewport);
	try
	{
		await common.closingOtherTabs(browser, page);
		await common.loginAll(page, username, password);
		await common.goingToPage(page, "https://www.minds.com/newsfeed/subscriptions");
		await common.goingToPage(page, "https://www.minds.com/newsfeed/subscriptions");
	}
	catch (error)
	{
		console.error('Probably Could not fully load the page'.red, error);
	}
	let postNumber = 1;
	for (let counter = 0; (postNumber < noPostToReview) && (counter < maxLoopTries) && (maxPageNotLoadCunter < maxPageNotLoadTries); counter++)
	{
		await common.scrol(page);
		let LastpostNumber = postNumber;
		let postsNumberSel = "body > m-app > m-page > m-body > div > div > m-newsfeed > div > div.m-newsfeed--feed.m-pageLayout__pane--main > m-newsfeed--subscribed > div";
		postNumber = await page.$eval(postsNumberSel, el => el.childElementCount);
		console.warn(`Detected Posts Number in the page: ${postNumber}`.yellow);
		await delay(12000);
		if (postNumber == LastpostNumber)
		{
			console.error('Could not load page more'.red);
			await common.scrols(page, 3);
			maxPageNotLoadCunter++;
		}
		for (let index = LastpostNumber;index < postNumber;index++)
		{
			console.warn(`=========================`.green);
			console.warn(`Post: # ${index}`.green);

			// if (index == 10)
			// {
			// 	await delay(1000000);
			// }
			let likePossibilityTMP = likePossibility;
			let repostPossibilityTMP = repostPossibility;
			let commentPossibilityTMP = commentPossibility;
			try
			{
				// When isArepost == null: topName, topUsername are the posters name.
				// when isArepost == true: means that: topName, topUsername are the reposter names
				let byBlockedAccount = null;
				let comUsers = false;
				let mostTrustedUser = false;

				let isArepostSel = `body > m-app > m-page > m-body > div > div > m-newsfeed > div > div.m-newsfeed--feed.m-pageLayout__pane--main > m-newsfeed--subscribed > div > m-activity:nth-child(${index}) > m-activity__ownerblock > div.m-activityOwnerBlock__body > a.m-activityOwnerBlock__displayName > i`;
				let posterNameSel = `body > m-app > m-page > m-body > div > div > m-newsfeed > div > div.m-newsfeed--feed.m-pageLayout__pane--main > m-newsfeed--subscribed > div > m-activity:nth-child(${index}) > m-activity__content > div > m-activity__remind > m-activity__ownerblock > div.m-activityOwnerBlock__body > a.m-activityOwnerBlock__displayName > strong`
				let posterUsernameSel = `body > m-app > m-page > m-body > div > div > m-newsfeed > div > div.m-newsfeed--feed.m-pageLayout__pane--main > m-newsfeed--subscribed > div > m-activity:nth-child(${index}) > m-activity__content > div > m-activity__remind > m-activity__ownerblock > div.m-activityOwnerBlock__body > a.m-activityOwnerBlock__displayName`;
				let topUsernameSel = `body > m-app > m-page > m-body > div > div > m-newsfeed > div > div.m-newsfeed--feed.m-pageLayout__pane--main > m-newsfeed--subscribed > div > m-activity:nth-child(${index}) > m-activity__ownerblock > div.m-activityOwnerBlock__body > a.m-activityOwnerBlock__displayName`;
				let topNameSel = `body > m-app > m-page > m-body > div > div > m-newsfeed > div > div.m-newsfeed--feed.m-pageLayout__pane--main > m-newsfeed--subscribed > div > m-activity:nth-child(${index}) > m-activity__ownerblock > div.m-activityOwnerBlock__body > a.m-activityOwnerBlock__displayName > strong`;
				let likeNoSel = `body > m-app > m-page > m-body > div > div > m-newsfeed > div > div.m-newsfeed--feed.m-pageLayout__pane--main > m-newsfeed--subscribed > div > m-activity:nth-child(${index}) > m-activity__toolbar > minds-button-thumbs-up > a > span`;
				let disLikeNoSel = `body > m-app > m-page > m-body > div > div > m-newsfeed > div > div.m-newsfeed--feed.m-pageLayout__pane--main > m-newsfeed--subscribed > div > m-featured-content:nth-child(${index}) > div > m-activity > m-activity__toolbar > minds-button-thumbs-down > a > span`;

				let promises = [];
				promises.push(page.$eval(isArepostSel, el => el.innerText));
				promises.push(page.$eval(posterNameSel, el => el.innerText));
				promises.push(page.$eval(posterUsernameSel, el => el.getAttribute('href')))
				promises.push(page.$eval(topUsernameSel, el => el.getAttribute('href')))
				promises.push(page.$eval(topNameSel, el => el.innerText));
				promises.push(page.$eval(likeNoSel, el => el.innerText));
				promises.push(page.$eval(disLikeNoSel, el => el.innerText));
				let results = await Promise.allSettled(promises);
				// results.forEach(element =>
				// {
				// 	if (element.status != 'rejected')
				// 	{
				// 		console.log(element);
				// 	}
				// });
				let isArepost = results[ 0 ].value || null;
				let posterName = results[ 1 ].value || null;
				let posterUsername = results[ 2 ].value || null;
				let topUsername = results[ 3 ].value || null;
				let topName = results[ 4 ].value || null;
				let likeNo = results[ 5 ].value || null;
				let disLikeNo = results[ 6 ].value || null;

				//If its a blocked Account
				try {byBlockedAccount = await page.$eval(`body > m-app > m-body > m-newsfeed > div.mdl-grid.m-newsfeed.m-page > div.mdl-cell.mdl-cell--8-col.m-newsfeed--feed > m-newsfeed--subscribed > div > minds-activity:nth-child(${index}) > div:nth-child(5) > div > div`, el => el.innerText);}
				catch (error)
				{
					// console.log('Cant read byBlockedAccount');
				}
				if (byBlockedAccount != null)
				{
					console.log('Just found a blocked One Before');
					continue;
				}
				// Fixing username Typo
				topUsername = common.trim(topUsername, '/');
				posterUsername = common.trim(posterUsername, '/');

				if (!topUsername || topUsername == username)
				{
					// console.log('It is not a post, it is a boosted or it is posted by myself
					//  or something else is wrong
					continue;
				}
				// console.log('Decision Optimizing ...');
				// If its a community user
				if (users.indexOf(topUsername) != -1 && defaults.useComUser)
				{
					comUsers = true;
					likePossibilityTMP = parseInt(likePossibilityTMP / comUsersPos, 10);
					repostPossibilityTMP = parseInt(repostPossibilityTMP / comUsersPos, 10);
					commentPossibilityTMP = parseInt(commentPossibilityTMP / comUsersPos, 10);
				}
				// If its a trusted user
				if (mostTrustedUsers.indexOf(topUsername) != -1)
				{
					mostTrustedUser = true;
					likePossibilityTMP = parseInt(likePossibilityTMP / mostTrustedUserPos, 10);
					repostPossibilityTMP = parseInt(repostPossibilityTMP / mostTrustedUserPos, 10);
					commentPossibilityTMP = parseInt(commentPossibilityTMP / mostTrustedUserPos, 10);
				}
				if (likeNo > likeNoThHigh)
				{
					likePossibilityTMP = parseInt(likePossibilityTMP / likeNoThHighPos, 10);
					repostPossibilityTMP = parseInt(repostPossibilityTMP / likeNoThHighPos, 10);
					commentPossibilityTMP = parseInt(commentPossibilityTMP / likeNoThHighPos, 10);
				}
				if (likeNo > likeNoThLow)
				{
					likePossibilityTMP = parseInt(likePossibilityTMP / likeNoThLowPos, 10);
					repostPossibilityTMP = parseInt(repostPossibilityTMP / likeNoThLowPos, 10);
					commentPossibilityTMP = parseInt(commentPossibilityTMP / likeNoThLowPos, 10);
				}
				if (isArepost != null) // It's a repost
				{
					repostPossibilityTMP = parseInt(repostPossibilityTMP * chanceForRepostReposters, 10);
					commentPossibilityTMP = parseInt(commentPossibilityTMP * chanceForRepostReposters, 10);
				}
				if (isArepost == null) // It's a post
				{
					likePossibilityTMP = parseInt(likePossibilityTMP / chanceForPostReposters, 10);
					repostPossibilityTMP = parseInt(repostPossibilityTMP / chanceForPostReposters, 10);
					commentPossibilityTMP = parseInt(commentPossibilityTMP / chanceForPostReposters, 10);
				}
				// console.log(`Poster Name: ${posterName}. isArepost: ${isArepost}. Poster Username: ${posterUsername}`);
				// console.log(`Top Name: ${topName} , Top Username: ${topUsername}`);
				// console.log(`Like NUmber: ${likeNo}, dislike number: ${disLikeNo}, is a user: ${comUsers}, mosttrusted ${mostTrustedUser}`);
				// console.log(`like pos: ${likePossibilityTMP}, repost pos: ${repostPossibilityTMP}, comment Pos: ${commentPossibilityTMP}`);
				// console.log('Deciding');
				let foucseOnElement = `body > m-app > m-page > m-body > div > div > m-newsfeed > div > div.m-newsfeed--feed.m-pageLayout__pane--main > m-newsfeed--subscribed > div > m-activity:nth-child(${index})`;
				try {await page.$eval(foucseOnElement, el => el.scrollIntoView(false));}
				catch (error)
				{
					console.log('Cant focuse on element');
				}
				await common.randomWaitFull(page);
				if (random.int(0, likePossibilityTMP) < 2000)
				{
					let sel = `body > m-app > m-page > m-body > div > div > m-newsfeed > div > div.m-newsfeed--feed.m-pageLayout__pane--main > m-newsfeed--subscribed > div > m-activity:nth-child(${index}) > m-activity__toolbar > minds-button-thumbs-up > a`;
					try
					{
						await page.$eval(sel, el => el.click());
						console.log(`${topName} liked`.rainbow);
						await delay(900);
					}
					catch (error)
					{
						console.log('Already Liked Or an Error', error);
					}
				}
				if (random.int(0, repostPossibilityTMP) < 2000 && config.noRePost == false)
				{
					try
					{
						let repostIconSel = `body > m-app > m-page > m-body > div > div > m-newsfeed > div > div.m-newsfeed--feed.m-pageLayout__pane--main > m-newsfeed--subscribed > div > m-activity:nth-child(${index}) > m-activity__toolbar > minds-button-remind > a`;
						// let repostSubsel = `body > m-app > m-page > m-body > div > div > m-newsfeed > div > div.m-newsfeed--feed.m-pageLayout__pane--main > m-newsfeed--subscribed > div > m-activity:nth-child(${index}) > m-activity__toolbar > minds-button-remind > m-modal-remind-composer > m-modal > div.m-modal-container > div > div.m-modal-remind-composer > div > a`;
						let repostSubsel = `body > m-app > m-page > m-overlay-modal > div.m-overlay-modal.m-overlayModal--remind > m-modal__remindcomposer > div > div > a > i`
						await page.$eval(repostIconSel, el => el.click());
						await common.randomWaitfor(page);
						await page.$eval(repostSubsel, el => el.click());
						console.log(`${topName} reposted`.rainbow);
						await common.randomWaitfor(page);
					}
					catch (error)
					{
						console.log('Already resposted or some Error', error);
					}
				}
				if (random.int(0, commentPossibilityTMP) < 2000)
				{
					let sel = `body > m-app > m-page > m-body > div > div > m-newsfeed > div > div.m-newsfeed--feed.m-pageLayout__pane--main > m-newsfeed--subscribed > div > m-activity:nth-child(${index}) > m-comments__entityoutlet > m-comment__poster > div > div.minds-body > div > form > m-text-input--autocomplete-container > minds-textarea > div`;
					try
					{
						await common.w8ClikTypeEnter(page, sel, config.comments[ random.int(0, config.comments.length - 1) ]);
						console.log(`${topName} commentet`.rainbow);
						await delay(2000)
					}
					catch (error)
					{
						console.log('Error in commenting', error);
					}
				}
				await common.scrol(page);
				await common.randomWaitfor(page);
			}
			catch (error)
			{
				console.log('Main loop:', error.message);
			}
		}
	}
	await common.UpdateConfigFile(config, username);
	await common.closingBrowser(browser, page);
	console.log('Done :)');
	isRunning = false;
	// process.exit(-2);
	return "OK";
}

var app = express();
let port = process.env.PORT || defaults.port;

if (defaults.useExpress)
{
	setInterval(function ()
	{
		try
		{
			https.get(config.herokoAppAddress);
		} catch (error)
		{
			console.log("Could not send the request", error);
		}
	}, 900000); // every 15 minutes (300000)

	app.get('/', (req, res) => res.send(new Date().toString()));
	app.listen(port, () => console.log(`Listening on port: ${port}!`));
}
if (defaults.useCron)
{
	console.log(`App will run every ${defaults.cronEveryHour} hour`.yellow);
	var job = new CronJob(`*/${defaults.cronEveryMin} * * * *`, async function cl()
	// var job = new CronJob(`* */${cronEveryHour} * * *`, async function cl()
	{
		if (typeof cl.counter == 'undefined')
		{
			cl.counter = 0;
			cl.dived = 0;
		}
		console.log(`Cron Running number: ${cl.counter++}`.yellow);
		if(random.int(1, defaults.botRunChance) == 1 && cl.counter != 1)
		{
			console.log(`Cron Dived ... ${cl.dived++}`.yellow);
			await run();
		}
	}, null, true, 'Asia/Tehran');
	job.start();
}

try
{
	run();
}
catch (error)
{
	console.log(error);
	// process.exit(-2);
	return "OK";

}

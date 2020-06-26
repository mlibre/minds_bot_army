"use strict"

const puppeteer = require('puppeteer');
// const puppeteer = require("puppeteer-extra");
// const pluginStealth = require("puppeteer-extra-plugin-stealth");
const random = require('random');
let common = require('./common');
let twitter = require('./twitter');
let defaults = require('./defaults.json');

let posts = null;
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

if(process.argv[2] != undefined)
{
	username = process.argv[2].toLowerCase();
	config = require(`./users/${username}/info.json`);
	password = config.password;
}
if(process.argv[3] != undefined)
{
	password = process.argv[3];
}
if(username == null)
{
	console.log('There is no default username, and you didnt pass a username also');
	process.exit(0);
}
let runPostbyFile = true;
let runTweet = false;

if(config.posting != undefined && config.posting == false)
{
	console.log('User wont post anything!');
	process.exit(0);	
}

if(config.tweet != undefined && config.tweet == true)
{
	runTweet = true;
}

try {
	posts = require(`./users/${username}/posts.json`);
} catch (error) {
	if(error.code == "MODULE_NOT_FOUND")
	{
		runPostbyFile = false;
		console.log('This User doest have posts.json file');
	}
	else
	{
		runPostbyFile = false;
		console.log('This User doest have valid posts.json file');
	}
}

if(runPostbyFile == false && runTweet == false)
{
	console.log('Nothing to for this user');
	process.exit(0);
}

let noPostToPost = config.noPostToPost + random.int(1, 5);
let userAgent = defaults.userAgent;

if(config.userAgent != "")
{
	userAgent = config.userAgent;
}

common.internetCheck();
common.publicIP();

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
if(config.args != undefined && config.args != null && config.args.length > 0)
{
	console.log('Adding args ...');
	args = [...args , ...config.args];
}
if(config.useTor != undefined && config.useTor == true && defaults.useTor != false)
{
	let ra = random.int(defaults.torRange[0], defaults.torRange[1]);
	args.push(`--proxy-server=socks5://127.0.0.1:90${ra}`);
	console.log('Using Tor on' , `90${ra}`);
}
const options =
{
	args,
	headless: defaults.headlessS,
	executablePath: "/usr/bin/google-chrome-stable",
	ignoreHTTPSErrors: true,
	userDataDir: `./users/${username}/chromData/`
};


function preload()
{
	Object.defineProperty(navigator, "languages", {
		get: function()
		{
		return ["en-US", "en"];
		},
	});

	window.navigator.chrome = {
		runtime: {},
  	};
	delete navigator.__proto__.webdriver;
	
	Object.defineProperty(navigator, 'webdriver',
	{
		get: () => false,
	});
}

async function runPostingByFile()
{
	// puppeteer.use(pluginStealth());
	const browser = await puppeteer.launch(options);
	const page = await browser.newPage();
	await page.evaluateOnNewDocument(preload);
	await page.setDefaultNavigationTimeout(50000);
	let viewport = {width: config.viewport[0] , height: config.viewport[1]};	
	await page.setViewport(viewport);
	let logStat = await common.loggedInCheck(page, username);
	if(logStat == false)
	{
		let r1 = await common.login(page, username, password);
		if(r1 == true)
		{
			console.log('Assertion!');
			await common.closingBrowser(browser, page);
			return -2;
		}
	}
	console.log('I am going to posts for number of' , noPostToPost);
	for (let index = 0; index < noPostToPost; index++)
	{
		let size = Object.keys(posts).length;
		if(size < 50)
		{
			console.log('Assertion, Not Enough Posts!');
			await common.closingBrowser(browser, page);
			return -1;
		}
		let post = random.int(0, size-1);
		// let post = random.int(313, 313);
		let content = posts[post];
		await page.click( '#message' , {"waitUntil" : "networkidle0"} );
		await common.randomWaitfor(page);
		if(content.introText != undefined)
		{
			await page.type('#message' , content.introText + "\n" , {delay: 30});
		}
		if(content.url != undefined)
		{
			await page.type('#message' , content.url + "\n" , {delay: 30});
		}
		if(content.tagLine != undefined)
		{
			await page.type('#message' , content.tagLine + "\n" , {delay: 30});
		}
		if(content.tags != undefined)
		{
			await page.type('#message' , "#" + content.tags.join(' #') , {delay: 30});
		}
		await common.randomWaitFull(page, 10 , 15, 8000);
		let sel = `body > m-app > m-body > m-newsfeed > div.mdl-grid.m-newsfeed.m-page > div.mdl-cell.mdl-cell--8-col.m-newsfeed--feed > m-newsfeed--subscribed > minds-newsfeed-poster > div > div.mdl-card__supporting-text > form > div > button`;
		await page.click( sel , {"waitUntil" : "networkidle0"} );
		console.log(post , "Posted.");
		await common.randomWaitFull(page, 10 , 15, 8000);
	}
	console.log('Done :)');
	await common.closingBrowser(browser, page);
}

async function runbyTweet()
{
	// puppeteer.use(pluginStealth());
	const browser = await puppeteer.launch(options);
	const page = await browser.newPage();
	await page.evaluateOnNewDocument(preload);
	await page.setDefaultNavigationTimeout(50000);
	let viewport = {width: config.viewport[0] , height: config.viewport[1]};	
	await page.setViewport(viewport);
	let logStat = await common.loggedInCheck(page, username);
	if(logStat == false)
	{
		let r1 = await common.login(page, username, password);
		if(r1 == true)
		{
			console.log('Assertion!');
			await common.closingBrowser(browser, page);
			return -2;
		}
	}
	await twitter.goodTweets(async function (res)
	{
		// console.log(res);
		let size = Object.keys(res).length;
		for (let index = 0; index < size; index++)
		{
			try
			{
				let tagsNu = 0;
				await common.randomWaitFull(page, 1 , 10, 1000);
				const element = res[index];
				await page.click( '#message' , {"waitUntil" : "networkidle0"} );
				await common.randomWaitfor(page);
				if(element.text != undefined)
				{
					tagsNu = (element.text.match(new RegExp("\#", "g")) || []).length;
					if(tagsNu > 4)
					{
						element.text = element.text.replace(/\#/g, '');
						tagsNu = (element.text.match(new RegExp("\#", "g")) || []).length;
					}
					element.text = element.text.slice(0, element.text.indexOf("https://t.co"));
					await page.type('#message' , element.text + "\n" , {delay: 30});
				}
				if(element.url != undefined)
				{
					await page.type('#message' , element.url + "\n" , {delay: 30});
				}
				if(tagsNu < 2)
				{
					await page.type('#message' , "#Twitter #tweets #tweet " + "\n" , {delay: 30});
				}
				// if(element.hashtags != undefined)
				// {
				// 	await page.type('#message' , "#" + element.hashtags.join(' #') , {delay: 30});
				// }
				await common.randomWaitFull(page, 10 , 15, 8000);
				await common.randomWaitFull(page, 3 , 7, 3000);
				let sel = `body > m-app > m-body > m-newsfeed > div.mdl-grid.m-newsfeed.m-page > div.mdl-cell.mdl-cell--8-col.m-newsfeed--feed > m-newsfeed--subscribed > minds-newsfeed-poster > div > div.mdl-card__supporting-text > form > div > button`;
				await page.click( sel , {"waitUntil" : "networkidle0"} );
				console.log(index , "Posted.");
				await common.randomWaitFull(page, 10 , 15, 8000);
				
			}
			catch (error)
			{
				console.log(error);
			}
		}
		console.log('Done :)');
		await common.closingBrowser(browser, page);
	});
}

try
{	
	if(runPostbyFile == true)
	{
		runPostingByFile();
	}
	if(runTweet == true)
	{
		runbyTweet();
	}
}
catch (error)
{
	console.log(error);
	process.exit(-2);
}


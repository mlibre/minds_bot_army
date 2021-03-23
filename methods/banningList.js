"use strict"
var fs = require('fs');
var util = require('util');
const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const random = require('random');
let common = require('./common');
let defaults = require('../defaults.json');

let log_file;
let log_stdout;

let username = defaults.username.toLowerCase();
let config = require(`./users/${username}/info.json`);
let password = config.password;

let users = [];
let banList = [];

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

let r = random.int(1, 150);
// let r = 0;
let userAgent = defaults.userAgent;
if(config.userAgent != "")
{
	userAgent = config.userAgent;
}

common.internetCheck();
common.publicIP();

if(defaults.logToFile)
{
	let logPath = `./users/${username}/likeout.log`;
	log_file = fs.createWriteStream(logPath, {flags : 'w'});
	log_stdout = process.stdout;
	console.log = function () {
		log_file.write(util.format.apply(null, arguments) + '\n');
		log_stdout.write(util.format.apply(null, arguments) + '\n');
	 }
	 console.error = console.log;
}

async function run()
{
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
		`--user-agent="${userAgent}"`
	];
	if(config.args != undefined && config.args != null && defaults.useTor == true)
	{
		console.log('Adding args ...');
		args = [...args , ...config.args];
	}
	const options =
	{
		args,
		headless: defaults.headlessS,
		ignoreHTTPSErrors: true,
		userDataDir: `./users/${username}/chromData/`
	};
	puppeteer.use(pluginStealth());
	const browser = await puppeteer.launch(options);
	const page = await browser.newPage();
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
	let r3 = await common.goingToBannedPage(page);
	if(r3 == true)
	{
		console.log('Assertion!');
		await browser.close();
		return -2;
	}
	r3 = await common.goingToBannedPage(page);
	if(r3 == true)
	{
		console.log('Assertion!');
		await browser.close();
		return -2;
	}
	await common.randomWaitfor(page);
	await common.gettingBanList(page, banList);
	console.log('Saving in file ... :)');
	fs.writeFileSync('./banlist.txt' , '');
	for (let index = 0; index < banList.length; index++)
	{
		fs.appendFileSync('./banlist.txt', banList[index] + '\n');
	}	
	await common.randomSleep(1,2);
	console.log('Done :)');
	await browser.close();
}

run();

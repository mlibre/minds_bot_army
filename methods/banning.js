"use strict"
var fs = require('fs');
var util = require('util');
var express = require('express');
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
let isRunning = true;

let users = [];

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
	console.log('Getting ban list from the file ... :)');
	let Banned = [];
	const BannedPath = './banlist.txt';
	
	Banned = fs.readFileSync(BannedPath, 'utf8').split('\n').filter(Boolean);
	console.log('Banning');
	for (let index = 0; index < Banned.length; index++)
	{
		common.internetCheck();
		try
		{
			await common.randomWaitfor(page);
			await common.randomWaitFull(page, 2 , 4, 3000);
			await page.goto(`https://www.minds.com/${Banned[index]}`  , {waitUntil: 'networkidle0'});
			await common.randomWaitfor(page);
			await common.randomWaitFull(page, 1 , 3, 2000);
			let sel = `body > m-app > m-body > m-channel > div.mdl-grid.channel-grid > section.mdl-cell.mdl-cell--4-col.m-channel-sidebar > m-channel--sidebar > div.mdl-card.m-border.minds-channel-bio.m-channel--bio > div.m-channel--name > minds-button-user-dropdown > button`;
			await page.click(sel , {"waitUntil" : "networkidle0"});
			await common.randomWaitfor(page);
			let newsfeedSelector = `body > m-app > m-body > m-channel > div.mdl-grid.channel-grid > section.mdl-cell.mdl-cell--4-col.m-channel-sidebar > m-channel--sidebar > div.mdl-card.m-border.minds-channel-bio.m-channel--bio > div.m-channel--name > minds-button-user-dropdown > ul > li:nth-child(1)`;
			await page.click(newsfeedSelector , {"waitUntil" : "networkidle0"});
			console.log(index, Banned[index], 'Banned');
		}
		catch (error)
		{
			console.log("Probably Already Banned", Banned[index]);
			// console.log(error);
		}
	}

	await common.randomSleep(1,2);
	console.log('Done :)');
	await browser.close();
}

run();
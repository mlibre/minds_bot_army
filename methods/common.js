"use strict"

let sleep = require("sleep");
const random = require('random');
const fs = require('fs');
let unique = require('array-unique');
let delay = require('delay');
let defaults = require('../defaults.json');

exports.waitAndClick = async function waitAndClick(page, sel)
{
	await delay(1000);
	await page.waitForSelector(sel);
	await page.click(sel , {"waitUntil" : "networkidle0"});
	await delay(3000);
}

exports.w8ClikType = async function w8ClikType(page, sel, text)
{
	await page.waitForSelector(sel);
	await page.click(sel , {"waitUntil" : "networkidle0"});
	await delay(3000);
	await page.type(sel , text);
	await delay(1000);
}

exports.w8ClikTypeEnter = async function w8ClikType(page, sel, text)
{
	await page.waitForSelector(sel);
	await page.click(sel , {"waitUntil" : "networkidle0"});
	await delay(3000);
	await page.type(sel , text);
	await delay(2000);
	await page.keyboard.press('Enter');
}

exports.typeOnCurrent = async function typeOnCurrent(page , text)
{
	await delay(2000);
	const el = await page.evaluateHandle(() => document.activeElement);
	await el.type(text);
	await delay(2000);
}

exports.typeOnCurrentEnter = async function typeOnCurrentEnter(page , text , mainPage)
{
	if(!mainPage)
	{
		mainPage = page;
	}
	await delay(2000);
	const el = await page.evaluateHandle(() => document.activeElement);
	await el.type(text);
	await delay(2000);
	await mainPage.keyboard.press('Enter');
	await delay(5000);
}

exports.UpdateConfigFile = async function (config, username)
{
	let jsonContent = JSON.stringify(config);
	fs.writeFile(`./users/${username}/info.json`, jsonContent, 'utf8', function (err) {
		if (err) {
			console.log("An error occured while writing JSON Object to File.");
			return console.log(err);
		}
		console.log("JSON file has been updated.");
	});
}

exports.randomWaitfor = async function (page, min=900 , max=4000)
{
	let r = random.int(min, max)
	await page.waitFor(r)
}

exports.randomSleep = async function (min=1 , max=6)
{
	let r = random.int(min, max)
	sleep.sleep(r);
}

exports.randomWaitFull = async function (page, min=1 , max=6, pd=1000)
{
	await page.waitFor(pd)
	let r = random.int(min, max)
	sleep.sleep(r)
}

exports.scrol = async function (page)
{
	let res = await page.evaluate(_ =>
	{
		let ranNum = Math.floor((Math.random() * 65) + 20);
		window.scrollBy(0, window.innerHeight + ranNum);
		return document.body.scrollHeight;
	});
	return res;
}

exports.scrols = async function (page, time)
{
	let resS = [];
	for (let index = 0; index < time; index++)
	{
		let tmp = await exports.scrol(page);
		resS.push(tmp);
		await exports.randomWaitfor(page);
		await delay(2000);
		let resSLen = resS.length;
		if(resSLen > 3)
		{
			if( (resS[resSLen-1] + resS[resSLen-2]) - (resS[resSLen-3] + resS[resSLen-4]) == 0 )
			{
				return -2;
			}
		}
	}
}

exports.subList = async function (page, username, subscriptions, subscriptionsBlackList)
{
	try
	{
		console.log('Finding subscribers ...');
		try { await page.goto(`https://www.minds.com/${username}/subscriptions`  , {waitUntil: 'networkidle0'}); }
		catch(error) { console.log('Error subList, could not fully open the page'); }
		await exports.randomWaitfor(page);
		await exports.scrols(page, 20);
		await exports.randomWaitFull(page, 3 , 7, 7000);
		await exports.scrols(page, 20);
		await exports.randomWaitFull(page, 3 , 7, 7000);
		await exports.scrols(page, 20);
		let subNumberSel = "body > m-app > m-body > m-channel-container > m-channel > div.mdl-grid.channel-grid > section.mdl-cell.mdl-cell--8-col > m-channel--subscriptions";
		let subNumber;
		try { subNumber = await page.$eval(subNumberSel, el => el.childElementCount ); }
		catch(error) { console.log('Error finding sun number'); }
		console.log(`${subNumber} subscribers.`);
		for (let index = 1; index < subNumber; index++)
		{
			let subNameSel = `body > m-app > m-body > m-channel-container > m-channel > div.mdl-grid.channel-grid > section.mdl-cell.mdl-cell--8-col > m-channel--subscriptions > div:nth-child(${index}) > minds-card-user > a > div.body > h3`;
			const subName = await page.$eval(subNameSel, el => el.innerText );
			subscriptions.push(subName);
			let subUsername = await page.$eval(`body > m-app > m-body > m-channel-container > m-channel > div.mdl-grid.channel-grid > section.mdl-cell.mdl-cell--8-col > m-channel--subscriptions > div:nth-child(${index}) > minds-card-user > a > div.body > span`, el => el.innerText );
			if(subUsername != null)
			{
				if(subUsername[0] == '@')
				{
					subscriptions.push(subUsername);
					subUsername = subUsername.slice(1);
				}
			}
			subscriptions.push(subUsername);
			subscriptions.push(subUsername.toLowerCase());
			console.log(subName, subUsername);
		}

		for (let i = 0; i < subscriptionsBlackList.length*7; i++)
		{
			let loc = subscriptions.indexOf(subscriptionsBlackList[i]);
			if ( loc != -1)
			{
				subscriptions.splice(loc, 1);
			}
		}
		unique(subscriptions);
		if(subscriptions.length == 0)
		{
			throw "No Sub";
		}
		return true;
	}
	catch (error)
	{
		console.log('ERROR SUBS');
		console.log(error);
		return false;
	}
}

exports.closeSession = async function (page)
{
	try
	{
		console.log('Closing Session ...');
		let sel = `body > m-app > m-v2-topbar > div.m-v2-topbar__Top > div > div.m-v2-topbar__Container--right > div.m-v2-topbar__UserMenu > m-user-menu > div.m-user-menu.m-dropdown > a`;
		await page.click(sel , {"waitUntil" : "networkidle0"});
		await exports.randomWaitfor(page);
		await exports.randomSleep(1,2);
		sel = `body > m-app > m-v2-topbar > div.m-v2-topbar__Top > div > div.m-v2-topbar__Container--right > div.m-v2-topbar__UserMenu > m-user-menu > div.m-user-menu.m-dropdown > ul > li:nth-child(10) > a`;
		await page.click(sel , {"waitUntil" : "networkidle0"});
		await exports.randomWaitfor(page);
		await exports.scrol(page);
		await exports.scrol(page);
		await exports.randomSleep(1,2);
		sel = `body > m-app > m-body > m-settings > div > div > div.m-page--main > m-settings--general > div.m-settings--section.m-border.m-settings--close-all-sessions > button`;
		await page.click(sel , {"waitUntil" : "networkidle0"});
		await exports.randomWaitfor(page);
		return true;
	}
	catch (error)
	{
		console.log('ERROR closeSession');
		// console.log(error);
		return false;
	}
}

exports.goingToPage = async function (page, link)
{
	try
	{
		console.log('Going to page ' + link)
		await page.goto(link , {waitUntil: ["networkidle0", "domcontentloaded"]});
		await delay(1000);
		return true;
	}
	catch (error)
	{
		console.log('ERROR going to page ' + link , error);
		return false;
	}
}

exports.usernameCheck = async function usernameCheck(page , UNSel , username, usernamePrefix) {
	await page.waitForSelector(UNSel);
	let pageUn = await page.$eval(UNSel, el => el.innerText );
	pageUn = pageUn.trim();
	pageUn = pageUn.toLowerCase();
	username = username.trim();
	username = username.toLowerCase();
	if(usernamePrefix)
	{
		username = usernamePrefix + username;
	}
	if (pageUn == username)
	{
		return true;
	}
	else
	{
		return false;
	}
}

exports.loggedInCheck = async function (page, username)
{
	try
	{
		console.log(`Checking Login status as ${username} ...`);
		try{ await page.goto('https://www.minds.com/newsfeed/subscriptions' , {"waitUntil" : "networkidle0"});
		}catch(error){ console.log('Error loggedInCheck, could not fully open the page'); }
		await exports.randomWaitfor(page);
		let UNSel = "body > m-app > m-topbarwrapper > m-v3topbar > div.m-v3Topbar__top > div > div.m-pageLayout__pane--main > div.m-v3Topbar__rightColumn > div > m-usermenu__v3 > div.m-user-menu.m-dropdown > ul > li.m-dropdownList__item.m-userMenuDropdown__item.m-userMenuDropdown__username.ng-star-inserted > a";
		let res = await exports.usernameCheck(page , UNSel , username , "@");
		if(res)
		{
			return true;
		}
		console.log('Not logged-in');
		throw false
	}
	catch (error)
	{
		throw error
	}
}

exports.login = async function (page, username, password)
{
	try
	{
		console.log(`Logging in as ${username} ...`);
		await page.goto('https://www.minds.com/login' , {"waitUntil" : "networkidle0"});
		await exports.randomWaitfor(page);
		await page.waitForSelector('#username');
		await page.type('#username' , username , {delay: 50});
		await exports.randomSleep(1,2);
		await page.type('#password' , password , {delay: 50});
		await exports.randomSleep(1,2);
		let submitSel = "m-login > div > div > div > minds-form-login > form > div.mdl-card__actions > m-shadowboxsubmitbutton"
		// let submitSel = "m-login > div > div > div > minds-form-login > form > div.mdl-card__actions > button";
		await exports.waitAndClick(page , submitSel);
		await exports.randomWaitfor(page);
		await exports.randomWaitFull(page, 3 , 8, 4000);
	}
	catch (error)
	{
		throw error;
	}
}

exports.loginAll = async function (page, username , password)
{
	try
	{
		await exports.loggedInCheck(page, username);
	}
	catch (e)
	{
		console.log(e);
		try
		{
			await exports.login(page, username, password);
		}
		catch (error)
		{
			throw error
		}
	}
}

exports.goingToBannedPage = async function (page)
{
	try
	{
		console.log('Going to banning page ...');
		await page.goto('https://www.minds.com/settings/blocked-channels' , {"waitUntil" : "networkidle0"});
		await exports.randomWaitfor(page);
		return false;
	}
	catch (error)
	{
		console.log('ERROR goingToBannedPage');
		return true;
	}
}

exports.gettingBanList = async function (page, banList)
{
	try
	{
		console.log('Getting Ban List');
		await exports.scrols(page, 40);
		let newsfeedSelector = `body > m-app > m-body > m-settings > div > div > div.m-page--main > m-settings__blockedchannels > div > div`;
		const NuOBanned = await page.$eval(newsfeedSelector, el => el.childElementCount );
		console.log(`${NuOBanned} banned.`);
		for (let index = 1; index <= NuOBanned; index++)
		{
			const banName = await page.$eval(`body > m-app > m-body > m-settings > div > div > div.m-page--main > m-settings__blockedchannels > div > div > div:nth-child(${index}) > div.m-settingsBlockedChannelsChannel__Username > a`, el => el.innerText );
			banList.push(banName);
		}
		await exports.randomWaitfor(page);
		await exports.randomWaitFull(page, 2 , 5, 10000);
		return false;
	}
	catch (error)
	{
		console.log('ERROR gettingBanList', error);
		return true;
	}
}

exports.getUsersListSync = function ()
{
	try
	{
		let userDirPath = './users';
		return fs.readdirSync(userDirPath);
	}
	catch (error)
	{
		console.log('ERROR getUsersList', error);
		return false;
	}
}

exports.getUsersList = function ()
{
	let users = [];
	try
	{
		let userDirPath = './users';
		users = fs.readdirSync(userDirPath);
		return users;
	}
	catch (error)
	{
		console.log('ERROR getUsersList', error);
		return false;
	}
}

exports.getLogSync = function (username)
{
	try
	{
		let userDirPath = `./users/${username}/likeout.log`;
		var data = fs.readFileSync(userDirPath, 'utf8');
		return data;
	}
	catch (error)
	{
		console.log('ERROR getLogSync', error);
		return false;
	}
}

exports.closingOtherTabs = async function (browser, page)
{
	let brWindows = await browser.pages();
	let i = 0;
	while(brWindows.length > 1)
	{
		// console.log(brWindows[i]._target._targetId);
		if(brWindows[i]._target._targetId != page._target._targetId)
		{
			await delay(1000);
			try { await brWindows[i].close(); }
			catch(error) { console.log("Page close error"); }
			brWindows = await browser.pages();
		}
		else
		{
			i++;
		}
	}
}

exports.closingBrowser = async function (browser, page)
{
	if(defaults.closeBrowser)
	{
		await exports.closingOtherTabs(browser, page);
		await delay(3000);
		try { await page.close(); }
		catch(error)
		{
			// console.log("Page close error");
		}
		await exports.randomWaitFull(page, 1 , 2, 1000);
		try { await browser.close(); }
		catch(error)
		{
			// console.log("browser close error");
		}
	}
}

exports.trim = function trim(text, val) {
	let str = text;
	if(text)
	{
		 str = text.replace(new RegExp('^'+val+'+|'+val+'+$','g'), '');
	}
	return str;
}


exports.preload = function() {
	// Object.defineProperty(navigator, "languages",
	// {
	// 	get: function () {
	// 		return ["en-US", "en"];
	// 	},
	// });
	// window.navigator.chrome = {
	// 	runtime: {},
	// };
	// Object.defineProperty(navigator, 'webdriver',
	// {
	// 	get: () => false,
	// });
	delete navigator.__proto__.webdriver;
	delete navigator.__proto__.webdriver;
	delete navigator.webdriver;
	window.navigator.chrome =
	{
		"app":
		{
			"isInstalled": false,
			"InstallState":
			{
				"DISABLED": "disabled",
				"INSTALLED": "installed", "NOT_INSTALLED": "not_installed"
			},
			"RunningState":
			{
				"CANNOT_RUN": "cannot_run", "READY_TO_RUN": "ready_to_run", "RUNNING": "running"
			}
		},
		"runtime":
		{
			"OnInstalledReason":
			{
				"CHROME_UPDATE": "chrome_update", "INSTALL": "install", "SHARED_MODULE_UPDATE": "shared_module_update", "UPDATE": "update"
			},
			"OnRestartRequiredReason":
			{
				"APP_UPDATE": "app_update", "OS_UPDATE": "os_update", "PERIODIC": "periodic"
			},
			"PlatformArch":
			{
				"ARM": "arm", "MIPS": "mips", "MIPS64": "mips64", "X86_32": "x86-32", "X86_64": "x86-64"
			},
			"PlatformNaclArch":
			{
				"ARM": "arm", "MIPS": "mips", "MIPS64": "mips64", "X86_32": "x86-32", "X86_64": "x86-64"
			},
			"PlatformOs":
			{
				"ANDROID": "android", "CROS": "cros", "LINUX": "linux", "MAC": "mac", "OPENBSD": "openbsd", "WIN": "win"
			},
			"RequestUpdateCheckStatus":
			{
				"NO_UPDATE": "no_update", "THROTTLED": "throttled", "UPDATE_AVAILABLE": "update_available"
			}
		}
	};
	window.navigator.languages = [ "en-US", "en" ];
}

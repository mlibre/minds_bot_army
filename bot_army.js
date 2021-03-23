let pm2 = require('pm2');
let common = require('./methods/common');
const random = require('random');
let cron = require('node-cron');
let tr = require('tor-request');
let defaults = require('./defaults.json');
var sleep = require('sleep');
let delay = require('delay');

let usersPosted = common.getUsersListSync();
let usersLiked = common.getUsersListSync();

if(process.argv[2] != undefined)
{
	defaults.cronEveryMin = process.argv[2];
}

console.log('I need to rest for 10 second :)');
sleep.sleep(10);


async function run(likesCounts, postsCounts, onlineLikes=[], onlinePosts=[])
{
	// console.log(likesCounts, postsCounts, onlineLikes, onlinePosts);
	let UP;
	let UL;
	if(postsCounts < defaults.maxConCurrentPost)
	{
		// console.log('run for posts');
		// console.log(users);
		if(usersPosted.length == 0)
		{
			console.log("Posts - I just did it for everyone :) literally everyone. sleep for a while");
			await delay(30000);
			usersPosted = common.getUsersListSync();
		}
		else
		{
			UP = usersPosted[random.int(0,usersPosted.length-1)];
			for (let index = 0; (index < 10) && (onlineLikes.indexOf(UP) != -1); index++)
			{
				console.log('Same pick - posts', UP, usersPosted);
				UP = usersPosted[random.int(0,usersPosted.length-1)];		
			}
			// console.log(UP, onlineLikes, usersPosted);
			usersPosted.splice(usersPosted.indexOf(UP), 1);
			if(onlineLikes.indexOf(UP) != -1)
			{
				console.log('Could not find a choice for posts, the user is already having another process!');
				// console.log(usersPosted, onlineLikes, UP);
			}
		}
	}
	if(likesCounts < defaults.maxConCurrentLike)
	{
		// console.log('run for likes');
		// console.log(likesCounts, defaults.maxConCurrentPost);
		// console.log(users);
		if(usersLiked.length == 0)
		{
			console.log("Likes - I just did it for everyone :) literally everyone. sleep for a while");
			await delay(30000);
			usersLiked = common.getUsersListSync();
		}
		else
		{
			
			UL = usersLiked[random.int(0,usersLiked.length-1)];
			for (let index = 0; (index < 10) && (onlinePosts.indexOf(UL) != -1); index++)
			{
				console.log('same pick - likes');
				UL = usersLiked[random.int(0,usersLiked.length-1)];		
			}
			// console.log(UL, onlinePosts, usersLiked);
			usersLiked.splice(usersLiked.indexOf(UL), 1);
			if(onlinePosts.indexOf(UL) != -1)
			{
				console.log('could not find a choice for likes, all busy');
				// console.log(usersLiked, onlinePosts, UL);
			}
			else if(random.int(1,defaults.likeRunPos) > 2)
			{
				onlineLikes.push(UL);
				runPm2ForLikes(UL);
			}
		}
	}
}

async function runPm2ForLikes(username)
{
	// console.log('Starting pm2 for liking for', username);
	pm2.connect(function(err)
	{
		if (err)
		{
			console.error(err);
			process.exit(2);
		}
		console.log("Starting Like, Repost, Comment for" , username);
		pm2.start(
		{
			name: `like for ${username}`,
			script: 'bot.js',
			args: [username],
			output: `./users/${username}/likeout.log`,
			error: `./users/${username}/likeout.log`,
			max_memory_restart: '300M',
			force: false,
			autorestart: false,
			// autorestart: true,
			// maxRestarts: 3,
			// minUptime: 10000,
			// restartDelay: 10000
		},
		function(err, apps)
		{			
			pm2.disconnect();   // Disconnects from PM2
			if (err) throw err
		});
		// console.log(users);
	});
}

tr.request('https://api.ipify.org', async function (err, res, body)
{
	if (!err && res.statusCode == 200 && defaults.useTor == true)
	{
		console.log("Tor is connected and Your public (through Tor) IP is: " + body);
		console.log(`Running every ${defaults.cronEveryMin} minutes. for 1/${defaults.botRunChance} chance`);
		if(defaults.runOnStart)
		{
			run(0,0);
		}
	}
	else if(defaults.useTor == false)
	{
		console.log('Running without using tor.');
		console.log(`Running every ${defaults.cronEveryMin} minutes. for ${defaults.botRunChance}`);
		if(defaults.runOnStart)
		{
			run(0,0);
		}
	}
	else if(err)
	{
		console.log('Well, Tor is not running on 127.0.0.1:90xx, that is sucks :))');
		console.log('You need run it on ports: 9050-9060, Set it on torrc');
		process.exit(-2);
	}
});

cron.schedule(`*/${defaults.cronEveryMin} * * * *`, async function pc()
{
	let onlineLikes = [];
	let onlinePosts = [];
	if( typeof pc.counter == 'undefined' )
	{
		pc.counter = 0;
		pc.dived = 0;
	}
	pc.counter++;
	console.log('Process Checking number:', pc.counter);
	if(random.int(1, defaults.botRunChance) == 1)
	{
		console.log('Timer Dived ...' , pc.dived++);
		pm2.list(function (err, apps)
		{
			let postsR = 0;
			let likesR = 0;
			for (let index = 0; index < apps.length; index++)
			{
				const element = apps[index];
				if(element.name.includes("like"))
				{
					if(element.pm2_env.status == "online")
					{
						likesR++;
						onlineLikes.push(element.name.split(' ')[2]);
					}
				}
				else if(element.name.includes("post"))
				{
					if(element.pm2_env.status == "online")
					{
						postsR++;
						onlinePosts.push(element.name.split(' ')[2]);
					}
				}
			}
			// console.log('Like and posts' , likesR, postsR);
			run(likesR,postsR , onlineLikes, onlinePosts);
		});
	}
});

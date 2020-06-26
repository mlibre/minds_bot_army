let Twitter = require('twitter');
const random = require('random');

let client = new Twitter(
{
	consumer_key: 'KEY',
	consumer_secret: 'SECRET',
	access_token_key: 'TOKEN',
	access_token_secret: 'secter'
});


exports.goodTweets = async function(cbf, tCount = 9)
{
	let today = new Date();
	let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
	let filtter = "-injured -Injured -fishermen -dying -suicide -acid -Delhi -delhi -kill -KILLED -Taliban -taliban -DiscoRaja -Bengaluru -Kashmiri -Islam -Hindu -hindu -salmon -Salmon";
	let queries = [`bee OR bees OR puppy OR dog OR bird ${filtter} filter:media filter:safe since:${date}`,
	`tree OR water OR earth OR fruit ${filtter} filter:media filter:safe since:${date}`,
	`cat OR kitten ${filtter} filter:media filter:safe since:${date}` ,
	`bird ${filtter} filter:media filter:safe since:${date}`,
	`trump :) OR trump fun OR trump America ${filtter} filter:media filter:safe since:${date}`,
	`BREAKING NEWS OR breaking news ${filtter} filter:safe since:${date}`,
	`hilarious ${filtter} filter:media filter:safe since:${date}`,
	`music ${filtter} filter:media filter:safe since:${date}`,
	`movie ${filtter} filter:media filter:safe since:${date}`,
	`eco ${filtter} filter:media filter:safe since:${date}`,
	`politics ${filtter} filter:safe filter:safe since:${date}`];
	let compelited = 0;
	let obj = {};
	let objC = 0;
	for (let j = 0; j < queries.length; j++)
	{
		const query = queries[j];
		let params =
		{
			q: query,
			count: tCount,
			result_type: "popular",
			lang: 'en'
		}
		
		let res = await client.get('https://api.twitter.com/1.1/search/tweets.json', params, function(error, tweets, response)
		{
			// console.log(tweets);
			
			compelited++;
			if (error)
			{
				console.log('Something Wrong With twitter API');
				return -3;
			}
			if(tweets.statuses.length == 0)
			{
				console.log('Nothings have found for query:' , j);
				return -2;
			}
			let url = null;
			// console.log(tweets.statuses.length , j);
			
			let index = random.int(0 , tweets.statuses.length - 1);
			
			let entities = tweets.statuses[index].entities;

			obj[objC] = {};
			obj[objC].text = tweets.statuses[index].text;
			if(entities.urls != undefined && entities.urls.length != 0)
			{
				url = entities.urls[0].expanded_url
			}
			if(entities.media != undefined && entities.media.length != 0)
			{
				url = entities.media[0].expanded_url;
			}
			obj[objC].url = url;
			obj[objC].hashtags = [];
			for (let i = 0; i < entities.hashtags.length; i++)
			{
				let ht = entities.hashtags[i].text;
				obj[objC].hashtags.push(ht);
			}
			objC++;
			if(compelited == queries.length)
			{
				cbf(obj);
			}
		});
	}
}

//node helper/jsonBuilder.js USERNAME /media/username/H/projects/thebot/users/username/file.txt
const fs = require('fs');
const readline = require('readline');

let username;
let filePath;
let obj = {};
let index = 0;
let counter = 0;
if(process.argv[2] != undefined)
{
	username = process.argv[2].toLowerCase();
}
if(process.argv[3] != undefined)
{
	filePath = process.argv[3];
}
if(process.argv[4] != undefined)
{
	counter = process.argv[4];
}

const rl = readline.createInterface({
	input: fs.createReadStream(filePath)
});
rl.on('line', (line) =>
{
	if(line == "")
	{
		return;
	}
	else if(index%3 == 0)
	{
		obj[counter.toString()] =
		{
			"introText": line,
		};
	}
	else if(index%3 == 1)
	{
		obj[counter.toString()]["url"] = line;
	}
	else if(index%3 == 2)
	{
		obj[counter.toString()]["tagLine"] = line;
		counter++;
	}
	index++;
});
rl.on('close', () =>
{
	console.log('Done reading file');
	let jsonContent = JSON.stringify(obj);
	fs.writeFile(`./users/${username}/posts_made.json`, jsonContent, 'utf8', function (err) {
		if (err) {
			console.log("An error occured while writing JSON Object to File.");
			return console.log(err);
		}
		console.log("JSON file has been updated.");
	});
	console.log(obj);

});

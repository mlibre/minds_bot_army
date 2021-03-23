const fs = require('fs');

let username = "USERNAME";
if(process.argv[2] != undefined)
{
	username = process.argv[2].toLowerCase();
}
let posts = require(`../users/${username}/posts.json`);

for (let index = 0; index < Object.keys(posts).length ;index++)
{
	if(posts[index] == undefined)
	{
		console.log('YOU DONT HAVE POST NUMBER:', index);
		process.exit(0);
	}
	// console.log(index, posts[index]);	
}
console.log('Done');
const fs = require('fs');

let username = "USERNAME";
if(process.argv[2] != undefined)
{
	filePath = process.argv[2];
}
let posts = require(filePath);
console.log(posts[0].length);

for (let index = 0; index < Object.keys(posts).length ;index++)
{
	if(posts[index] == undefined)
	{
		console.log('YOU DONT HAVE POST NUMBER:', index);
		process.exit(0);
	}
	// console.log(index, posts[index]);	
}
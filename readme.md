:blush: :robot: Minds.com Bot :robot: :blush:
---
Most **advanced Bot-Army** for **minds.com**. Designed to earn tokens automatically for **minds.com**.
You can use as **one bot** for one account or you can give it multiple accounts (an army) to earn hundreds token per day.
Features:
* Automatic liking
* Auto Commenting
* Targeting specific Accounts
* Auto earn
* Autorun
* Scheduling
* Can use tor out-of-box
* And More

# Requirements
* NodeJs
* Linux Probably
* Canery Mod (minds.com)

# Up & Running
~~~bash
sudo pacman -S nodejs google-chrome build-essential make g++
git clone https://github.com/mlibre/minds_bot_army.git
npm install
# npm rebuild
nano defaults.json # set botRunChance and runOnStart and mostTrustedUsers and other options
# Now define your users.
# For each user u should create a folder like users/USERNAME in the users folder. And set the user account settings
~~~
## Tor
If you want to use tor:
~~~bash
sudo pacman -S tor
sudo nano /etc/tor/torrc:
# your file should have lines like this
SocksPort 9050
SocksPort 9051
SocksPort 9052
SocksPort 9053
SocksPort 9054
sudo systemctl enable tor
sudo systemctl restart tor
~~~
## Bot army - pm2
If you want to run the bot army:
~~~bash
sudo npm install pm2 -g
pm2 startup
pm2 start bot_army.js --name minds_bot
pm2 save
~~~

## Single Account
To run as a single bot - account:
~~~bash
node bot.js
node bot.js -u username  -c -h
node bot.js -u username -p password -h -c
~~~

# Heroku Settings
```bash
# In package.json: "puppeteer": "2.1.1",
# sudo rm -r .git
# heroku buildpacks:clear
# heroku git:remote -a nodejstestappp
# heroku ps:scale web=1
# heroku restart
# heroku apps:destroy mindscombot
# heroku logs --tail
rm package-lock.json
heroku login -i
heroku create mindscombot
# copy the output link to info.json
git add --all
git commit -m "first message"
heroku buildpacks:add --index 1 https://github.com/jontewks/puppeteer-heroku-buildpack
heroku buildpacks:add --index 1 heroku/nodejs
git push heroku master
```

# Configuration
There two options: `Global` and `Locals`.
Global configs are located in `defaults.json`. Like `useTor`, `headlessS`, .....
User specific options are located in each user account `info.json` file.
For example there is `useTor` option in `global` and `local` both.
So if you set useTor to `true`  in `defaults.json`. you need to also set it `true` for each user you want to use tor in his `info.json`.
Using `tor` and `headless` are `false` by default, you can set them to true.

### Important Global options
```javascript
"headlessS": false,
"useTor": false
"torRange": [50,50] // tor ports. if you have SocksPort 9050 -> SocksPort 9054 then set this option to [50,54]
```

### Important Local options
```javascript
"posting": false // Where user use post.json file to post or not
```

Donate
=======
Donate or .... :heartpulse:
ETH:
> 0xc9b64496986E7b6D4A68fDF69eF132A35e91838e

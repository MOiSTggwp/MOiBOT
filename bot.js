const yt = require('ytdl-core');
const YoutubeDL = require('youtube-dl');
var requestl = require('superagent');

const API_KEY = process.env.YOUTUBE_API_KEY;
const WATCH_VIDEO_URL = "https://www.youtube.com/watch?v=";

let queue = {};

const commands = {
	'play_': (msg) => {
		if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Добавьте больше песен в список с помощью команды \'${process.env.PREFIX}play\'`);
		if (!msg.guild.voiceConnection) return commands.join(msg).then(() => commands.play_(msg));
		if (queue[msg.guild.id].playing) return /*msg.channel.sendMessage('Уже работаю...')*/;
		let dispatcher;
		queue[msg.guild.id].playing = true;

	//	console.log(queue);
		(function play(song) {
	//		console.log(song);
			if (song === undefined) return msg.channel.sendMessage('Список воспроизведения пуст').then(() => {
				queue[msg.guild.id].playing = false;
				msg.member.voiceChannel.leave();
			});
			msg.channel.sendMessage(`Играет: ** ${song.title} **`);
			dispatcher = msg.guild.voiceConnection.playStream(yt(song.url, { audioonly: true }), { passes : process.env.passes });
			let collector = msg.channel.createCollector(m => m);
			collector.on('message', m => {
			/*	if (m.content.startsWith(process.env.PREFIX + 'pause')) {
					msg.channel.sendMessage(`Пауза`).then(() => {dispatcher.pause();});
				} else*/ if (m.content.startsWith(process.env.PREFIX + 'play')){
					dispatcher.resume();
				} else if (m.content.startsWith(process.env.PREFIX + 'skip')){
					msg.channel.sendMessage(`~~**$Пропущена песня**~~`).then(() => {dispatcher.end();});
				} else if (m.content.startsWith(process.env.PREFIX + 'vol+')){
					if (Math.round(dispatcher.volume*50) >= 100) return msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume*50)}%`);
					dispatcher.setVolume(Math.min((dispatcher.volume*50 + (2*(m.content.split('+').length-1)))/50,2));
					msg.channel.sendMessage(`Громкость: ${Math.round(dispatcher.volume*50)}%`);
				} else if (m.content.startsWith(process.env.PREFIX + 'vol-')){
					if (Math.round(dispatcher.volume*50) <= 0) return msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume*50)}%`);
					dispatcher.setVolume(Math.max((dispatcher.volume*50 - (2*(m.content.split('-').length-1)))/50,0));
					msg.channel.sendMessage(`Громкость: ${Math.round(dispatcher.volume*50)}%`);
				} else if (m.content.startsWith(process.env.PREFIX + 'time')){
					msg.channel.sendMessage(`Играет: ${Math.floor(dispatcher.time / 60000)}:${Math.floor((dispatcher.time % 60000)/1000) <10 ? '0'+Math.floor((dispatcher.time % 60000)/1000) : Math.floor((dispatcher.time % 60000)/1000)}`);
				}
			});
			dispatcher.on('end', () => {
				collector.stop();
				play(queue[msg.guild.id].songs.shift());
			});
			dispatcher.on('error', (err) => {
				return msg.channel.sendMessage('Ошибка: ' + err).then(() => {
					collector.stop();
					play(queue[msg.guild.id].songs.shift());
				});
			});
		})(queue[msg.guild.id].songs.shift());
	},
	'join': (msg) => {
		return new Promise((resolve, reject) => {
			const voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel || voiceChannel.type !== 'voice') return msg.reply('Не могу подключиться к голосовому чату...');
			voiceChannel.join().then(connection => resolve(connection)).catch(err => reject(err));
		});
	},
	'play': (msg) => {/*
		let arg = msg.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
		arg.shift().toLowerCase();
		let url = arg.join('%20');
		if (url == '' || url === undefined) return msg.channel.sendMessage(`Необходимо добавить песен в список воспроизведения`);
		yt.getInfo(url, (err, info) => {
			if(err) {	
			//	url = url.split(' ').join('%20');
				console.log('https://www.googleapis.com/youtube/v3/search' + '?part=snippet&q=' + url + '&key=' + API_KEY);
				var requestUrl = 'https://www.googleapis.com/youtube/v3/search' + '?part=snippet&q=' + url + '&key=' + API_KEY;
				requestl(requestUrl, (error, response) => {
					if (!error && response.statusCode == 200) {
						var body = response.body;
					//	console.log(body);
						if (body.items.length == 0) {
							console.log("I Could Not Find Anything!");
							msg.channel.sendMessage('Invalid YouTube Link: ' + err);
							return;
						}
						for (var item of body.items) {
							if (item.id.kind == 'youtube#video') {
								url = WATCH_VIDEO_URL+item.id.videoId;
								var name = item.id.title;
								if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
								queue[msg.guild.id].songs.push({url: url, title: name, requester: msg.author.username});
								msg.channel.sendMessage(`**${item.id.title}** __теперь в текущем плейлисте__`).then(() => commands.play_(msg));
								return;
							}
						}
					} else {
						console.log("Unexpected error!");
						return;
					}
				});	
				return;
			}
			if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
			queue[msg.guild.id].songs.push({url: url, title: info.title, requester: msg.author.username});
			msg.channel.sendMessage(`**${info.title}** __теперь в текущем плейлисте__`).then(() => commands.play_(msg));
		});*/
		let arg = msg.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
		arg.shift().toLowerCase();
		let suffix = arg.join('%20');
		msg.channel.sendMessage( wrap('Поиск...')).then(response => {
			// If the suffix doesn't start with 'http', assume it's a search.
			if (!suffix.toLowerCase().startsWith('http')) {
				suffix = 'gvsearch1:' + suffix;
			}
			
			// Get the video info from youtube-dl.
			YoutubeDL.getInfo(suffix, ['-q', '--no-warnings', '--force-ipv4'], (err, info) => {
				// Verify the info.
				if (err || info.format_id === undefined || info.format_id.startsWith('0')) {
					console.error(err);
					return response.edit( wrap('Произошла ошибка!'));
				}
				
				// Queue the video.
				response.edit( wrap('В очередь добавлено: ' + info.title)).then((resp) => {
					if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
					queue[msg.guild.id].songs.push({url: url, title: info.title, requester: msg.author.username});

				}).catch(() => {});
			});
		}).catch(() => {});
	},
        'queue': (msg) => {
		if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Добавьте больше песен в список с помощью команды \'${process.env.PREFIX}play\'`);
		let tosend = [];
		queue[msg.guild.id].songs.forEach((song, i) => { tosend.push(`${i+1}. ${song.title} - Добавил : ${song.requester}`);});
		msg.channel.sendMessage(`__**Плейлист:**__ Песен в очереди - **${tosend.length}** ${(tosend.length > 7 ? '*[Показаны только следующие 7 песен]*' : '')}\`\`\`\n ${tosend.slice(0,7).join('\n')} \`\`\``);
	}
};

exports.commands = [
	"play",
	"skip",
	"queue",
	"dequeue",
	"pause",
	"resume",
	"volume"
]

exports.play = {
	usage: "[Поисковый запрос или ссылка на видео]",
	description: "Проигрывает звук в голосовом чате",
	process :function(client, msg, suffix, isEdit){
		if(isEdit) return;
		var arr = msg.guild.channels.filter((v)=>v.type == "voice").filter((v)=>v.members.has(msg.author.id));
		// Make sure the user is in a voice channel.
		if (arr.length == 0) return msg.channel.sendMessage( wrap('Вы должны находиться в голосовом чате чтобы включить музыку'));
		
		////////////////////////////////////
		commands.play(msg);
		
	}
}

exports.skip = {
	description: "Пропустить песню",
	process:function(client, msg, suffix) {
		// Get the voice connection.
		const voiceConnection = client.voiceConnections.get(msg.guild.id);
		if (voiceConnection === null) return msg.channel.sendMessage( wrap('Музыка сейчас не играет.'));
		
	}
}

exports.queue = {
	description: "Выводит список песен",
	process: function(client, msg, suffix) {
		commands.queue(msg);
	}
}

/*exports.dequeue = {
	description: "Убиарет песню из списка по номеру.",
	process: function(client, msg, suffix) {
		
	}
}*/

exports.pause = {
	description: "Остановить проигрывание",
	process: function(client, msg, suffix) {
		// Get the voice connection.
		const voiceConnection = client.voiceConnections.get(msg.guild.id);
		if (voiceConnection == null) return msg.channel.sendMessage( wrap('Список проигрывания пуст.'));

		// Pause.
		msg.channel.sendMessage( wrap('Пауза'));
		if (voiceConnection.player.dispatcher) voiceConnection.player.dispatcher.pause();
	}
}

exports.resume = {
	description: "Продолжить проигрывание",
	process: function(client, msg, suffix) {
		// Get the voice connection.
		const voiceConnection = client.voiceConnections.get(msg.guild.id);
		if (voiceConnection == null) return msg.channel.sendMessage( wrap('Список проигрывания пуст.'));

		// Resume.
		msg.channel.sendMessage( wrap('Проигрывается.'));
		if (voiceConnection.player.dispatcher) voiceConnection.player.dispatcher.resume();
	}
}

exports.volume = {
	usage: "[volume|volume%|volume dB]",
	description: "Устанавливает громкость музыки в численном значении, в процентах, в децибелах",
	process: function(client, msg, suffix) {
		// Get the voice connection.
		const voiceConnection = client.voiceConnections.get(msg.guild.id);
		if (voiceConnection == null) return msg.channel.sendMessage( wrap('Список проигрывания пуст.'));
		// Set the volume
		if (voiceConnection.player.dispatcher) {
			if(suffix == ""){
				var displayVolume = Math.pow(voiceConnection.player.dispatcher.volume,0.6020600085251697) * 100.0;
				msg.channel.sendMessage(wrap("volume: " + displayVolume + "%"));
			} else {
				if(suffix.toLowerCase().indexOf("db") == -1){
					if(suffix.indexOf("%") == -1){
						if(suffix > 1) suffix /= 100.0;
						voiceConnection.player.dispatcher.setVolumeLogarithmic(suffix);
					} else {
						var num = suffix.split("%")[0];
						voiceConnection.player.dispatcher.setVolumeLogarithmic(num/100.0);
					}
				} else {
					var value = suffix.toLowerCase().split("db")[0];
					voiceConnection.player.dispatcher.setVolumeDecibels(value);
				}
			}
		}
	}
}

function getAuthorVoiceChannel(msg) {
	var voiceChannelArray = msg.guild.channels.filter((v)=>v.type == "voice").filter((v)=>v.members.has(msg.author.id)).array();
	if(voiceChannelArray.length == 0) return null;
	else return voiceChannelArray[0];
}

function wrap(text) {
	return '```\n' + text.replace(/`/g, '`' + String.fromCharCode(8203)) + '\n```';
}



var fs = require('fs');

process.on('unhandledRejection', (reason) => {
  console.error(reason);
  process.exit(1);
});

try {
	var Discord = require("discord.js");
} catch (e){
	console.log(e.stack);
	console.log(process.version);
	console.log("Please run npm install and ensure it passes with no errors!");
	process.exit();
}
console.log("Starting DiscordBot\nNode version: " + process.version + "\nDiscord.js version: " + Discord.version);

// Get authentication data
var AuthDetails = {
	'client_id':process.env.BOT_ID,
	'bot_token':process.env.BOT_TOKYN
};

// Load custom permissions
var dangerousCommands = ["eval","pullanddeploy","setUsername"];
var Permissions = {};
try{
	Permissions = require("./permissions.json");
} catch(e){
	Permissions.global = {};
	Permissions.users = {};
}

for( var i=0; i<dangerousCommands.length;i++ ){
	var cmd = dangerousCommands[i];
	if(!Permissions.global.hasOwnProperty(cmd)){
		Permissions.global[cmd] = false;
	}
}
Permissions.checkPermission = function (user,permission){
	try {
		var allowed = true;
		try{
			if(Permissions.global.hasOwnProperty(permission)){
				allowed = Permissions.global[permission] === true;
			}
		} catch(e){}
		try{
			if(Permissions.users[user.id].hasOwnProperty(permission)){
				allowed = Permissions.users[user.id][permission] === true;
			}
		} catch(e){}
		return allowed;
	} catch(e){}
	return false;
}
fs.writeFile("./permissions.json",JSON.stringify(Permissions,null,2), (err) => {
	if(err) console.error(err);
});

//load config data
var Config = {};
try{
	Config = require("./config.json");
} catch(e){ //no config file, use defaults
	Config.debug = false;
	Config.commandPrefix = '=';
	try{
		if(fs.lstatSync("./config.json").isFile()){
			console.log("WARNING: config.json found but we couldn't read it!\n" + e.stack);
		}
	} catch(e2){
		fs.writeFile("./config.json",JSON.stringify(Config,null,2), (err) => {
			if(err) console.error(err);
		});
	}
}
if(!Config.hasOwnProperty("commandPrefix")){
	Config.commandPrefix = '=';
}

var messagebox;
var aliases;
try{
	aliases = require("./alias.json");
} catch(e) {
	//No aliases defined
	aliases = {};
}

var commands = {	
	"alias": {
		usage: "[Имя] [Текущая комана]",
		description: "Можно упростить запуск команд бота",
		process: function(bot,msg,suffix) {
			var args = suffix.split(" ");
			var name = args.shift();
			if(!name){
				msg.channel.send(Config.commandPrefix + "alias " + this.usage + "\n" + this.description);
			} else if(commands[name] || name === "help"){
				msg.channel.send("!");
			} else {
				var command = args.shift();
				aliases[name] = [command, args.join(" ")];
				//now save the new alias
				require("fs").writeFile("./alias.json",JSON.stringify(aliases,null,2), null);
				msg.channel.send("Создана комада " + name);
			}
		}
	},
	"aliases": {
		description: "Выводит все добавленные команды",
		process: function(bot, msg, suffix) {
			var text = "current aliases:\n";
			for(var a in aliases){
				if(typeof a === 'string')
					text += a + " ";
			}
			msg.channel.send(text);
		}
	},
    "ping": {
        description: "Отвечает если бот онлайн",
        process: function(bot, msg, suffix) {
            msg.channel.send( msg.author+" pong!");
            if(suffix){
                msg.channel.send( "Не надо ничего писать кроме ping!");
            }
        }
    },
    "text": {
        usage: "[Текст]",
        description: "Бот говорит вашу фразу",
        process: function(bot,msg,suffix){ msg.channel.send(suffix);}
    },
	"say": {
        usage: "[Текст]",
        description: "Бот произносит вашу фразу",
        process: function(bot,msg,suffix){ msg.channel.send(suffix,{tts:true});}
    },
	"msg": {
		usage: "[Никнейм] [Сообщение]",
		description: "Оставляет сообщение пользователю до того момента, как он будет онлайн",
		process: function(bot,msg,suffix) {
			var args = suffix.split(' ');
			var user = args.shift();
			var message = args.join(' ');
			if(user.startsWith('<@')){
				user = user.substr(2,user.length-3);
			}
			var target = msg.channel.guild.members.find("id",user);
			if(!target){
				target = msg.channel.guild.members.find("username",user);
			}
			messagebox[target.id] = {
				channel: msg.channel.id,
				content: target + ", " + msg.author + " передал сообщение: " + message
			};
			updateMessagebox();
			msg.channel.send("Сообщение сохранено.")
		}
	},
	"eval": {
		usage: "[Команда]",
		description: 'Выполняет javascript код в программе бота(только для разработчика)',
		process: function(bot,msg,suffix) {
			if(Permissions.checkPermission(msg.author,"eval")){
				let result = eval(suffix,bot).toString();
				if(result) {
					msg.channel.send(result);
				}
			} else {
				msg.channel.send( msg.author + " у вас отсутствуют права на запуск!");
			}
		}
	}
};

if(AuthDetails.hasOwnProperty("client_id")){
	commands["invite"] = {
		description: "Создает ссылку для приглашения бота на свой сервер",
		process: function(bot,msg,suffix){
			msg.channel.send("invite link: https://discordapp.com/oauth2/authorize?&client_id=" + AuthDetails.client_id + "&scope=bot&permissions=8");
		}
	}
}


try{
	messagebox = require("./messagebox.json");
} catch(e) {
	//no stored messages
	messagebox = {};
}
function updateMessagebox(){
	require("fs").writeFile("./messagebox.json",JSON.stringify(messagebox,null,2), null);
}

var bot = new Discord.Client();

bot.on("ready", function () {
	console.log("Logged in! Serving in " + bot.guilds.array().length + " servers");
	require("./plugins.js").init();
	console.log("type "+Config.commandPrefix+"help in Discord for a commands list.");
	bot.user.setPresence({
		game: {
			name: Config.commandPrefix+"help | " + bot.guilds.array().length +" Servers"
		}
	}); 
});

bot.on("disconnected", function () {

	console.log("Disconnected!");
	process.exit(1); //exit node.js with an error

});


/*Пишет в чат о том, что человек покинул сервер*/
bot.on('guildMemberAdd', member => {
	const channel = member.guild.channels.find('name', 'member-log');
	if (!channel) return;
	channel.send(`К великому сожалению, нас покинул холоп ${member}((`);
});

/*Пишет в лог, когда бота добавили насервер*/
bot.on("guildCreate", guild => {
	console.log(`Меня добавили на сервер: ${guild.name} (id: ${guild.id}). На этом сервере ${guild.memberCount} участников!`);
});

/*Пишет в лог, когда бота выгнали из чата*/
bot.on("guildDelete", guild => {
	console.log(`Меня выгнали из: ${guild.name} (id: ${guild.id})`);
});


function checkMessageForCommand(msg, isEdit) {
	//check if message is a command
	if(msg.author.id != bot.user.id && (msg.content.startsWith(Config.commandPrefix))){
        console.log("treating " + msg.content + " from " + msg.author + " as command");
		var cmdTxt = msg.content.split(" ")[0].substring(Config.commandPrefix.length);
        var suffix = msg.content.substring(cmdTxt.length+Config.commandPrefix.length+1);//add one for the ! and one for the space
        if(msg.isMentioned(bot.user)){
			try {
				cmdTxt = msg.content.split(" ")[1];
				suffix = msg.content.substring(bot.user.mention().length+cmdTxt.length+Config.commandPrefix.length+1);
			} catch(e){ //no command
				msg.channel.send("Yes?");
				return;
			}
        }
		alias = aliases[cmdTxt];
		if(alias){
			console.log(cmdTxt + " is an alias, constructed command is " + alias.join(" ") + " " + suffix);
			cmdTxt = alias[0];
			suffix = alias[1] + " " + suffix;
		}
		var cmd = commands[cmdTxt];
        if(cmdTxt === "help"){
            //help is special since it iterates over the other commands
						if(suffix){
							var cmds = suffix.split(" ").filter(function(cmd){return commands[cmd]});
							var info = "";
							for(var i=0;i<cmds.length;i++) {
								var cmd = cmds[i];
								info += "**"+Config.commandPrefix + cmd+"**";
								var usage = commands[cmd].usage;
								if(usage){
									info += " " + usage;
								}
								var description = commands[cmd].description;
								if(description instanceof Function){
									description = description();
								}
								if(description){
									info += "\n\t" + description;
								}
								info += "\n"
							}
							msg.channel.send(info);
						} else {
							msg.author.send("**Available Commands:**").then(function(){
								var batch = "";
								var sortedCommands = Object.keys(commands).sort();
								for(var i in sortedCommands) {
									var cmd = sortedCommands[i];
									var info = "**"+Config.commandPrefix + cmd+"**";
									var usage = commands[cmd].usage;
									if(usage){
										info += " " + usage;
									}
									var description = commands[cmd].description;
									if(description instanceof Function){
										description = description();
									}
									if(description){
										info += "\n\t" + description;
									}
									var newBatch = batch + "\n" + info;
									if(newBatch.length > (1024 - 8)){ //limit message length
										msg.author.send(batch);
										batch = info;
									} else {
										batch = newBatch
									}
								}
								if(batch.length > 0){
									msg.author.send(batch);
								}
						});
					}
        }
		else if(cmd) {
			if(Permissions.checkPermission(msg.author,cmdTxt)){
				try{
					cmd.process(bot,msg,suffix,isEdit);
				} catch(e){
					var msgTxt = "Запуск команды " + cmdTxt + " провалился :(";
					if(Config.debug){
						 msgTxt += "\n" + e.stack;
						 console.log(msgTxt);
					}
					if(msgTxt.length > (1024 - 8)){ //Truncate the stack if it's too long for a discord message
						msgTxt = msgTxt.substr(0,1024-8);
					}
					msg.channel.send(msgTxt);
				}
			} else {
				msg.channel.send("Нет прав для запуска команды " + cmdTxt + "!");
			}
		} else {
			msg.channel.send(cmdTxt + " Такой команды не существует!").then((message => message.delete(5000)))
		}
	} else {
		//message isn't a command or is from us
        //drop our own messages to prevent feedback loops
        if(msg.author == bot.user){
            return;
        }

        if (msg.author != bot.user && msg.isMentioned(bot.user)) {
                msg.channel.send("Вы уверены?"); //using a mention here can lead to looping
        } else {

				}
    }
}

bot.on("message", (msg) => checkMessageForCommand(msg, false));
bot.on("messageUpdate", (oldMessage, newMessage) => {
	checkMessageForCommand(newMessage,true);
});

//Log user status changes
bot.on("presence", function(user,status,gameId) {
	//if(status === "online"){
	//console.log("presence update");
	console.log(user+" went "+status);
	//}
	try{
	if(status != 'offline'){
		if(messagebox.hasOwnProperty(user.id)){
			console.log("found message for " + user.id);
			var message = messagebox[user.id];
			var channel = bot.channels.get("id",message.channel);
			delete messagebox[user.id];
			updateMessagebox();
			bot.send(channel,message.content);
		}
	}
	}catch(e){}
});

exports.addCommand = function(commandName, commandObject){
    try {
        commands[commandName] = commandObject;
    } catch(err){
        console.log(err);
    }
}

exports.commandCount = function(){
    return Object.keys(commands).length;
}

if(AuthDetails.bot_token){
	console.log("logging in with token");
	bot.login(AuthDetails.bot_token);
} else {
	console.log("Logging in with user credentials is no longer supported!\nYou can use token based log in with a user account, see\nhttps://discord.js.org/#/docs/main/master/general/updating");
}

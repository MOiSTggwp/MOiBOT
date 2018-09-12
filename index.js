const Discord = require('discord.js');
const bot = new Discord.Client();

var prefix = '!'
 
 bot.on('message', (message) => {
    if(message.author === bot.user) return;
    if(message.content.startsWith(prefix + 'help')) {
        message.channel.sendMessage('Привет я БОТ!');
     }

     if (message.content === (prefix + 'join')) {
        // Only try to join the sender's voice channel if they are in one themselves
        if (message.member.voiceChannel) {
          message.member.voiceChannel.join()
            .then(connection => { // Connection is an instance of VoiceConnection
              message.reply('Я тут!');
            })
            .catch(console.log);
        } else {
          message.reply('Для начала зайди в голосовой канал!');
        }
      }
});


bot.login(process.env.BOT_TOKYN);

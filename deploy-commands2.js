const { REST, Routes } = require('discord.js');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

console.log('🔄 Loading commands...\n');

// โหลดไฟล์ commands ทั้งหมด
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const command = require(path.join(commandsPath, file));
    
    if (command.data) {
      commands.push(command.data.toJSON());
      console.log(`✅ ${command.name}`);
    } else {
      console.warn(`⚠️ ${file} - no data property`);
    }
  } catch (error) {
    console.error(`❌ ${file} - ${error.message}`);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`\n🚀 Registering ${commands.length} commands to guild...\n`);
    
    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log(`✅ Successfully registered ${data.length} commands!\n`);
    console.log('📋 Commands:');
    data.forEach(cmd => {
      const icon = cmd.options ? '⚙️' : '🎯';
      console.log(`  ${icon} /${cmd.name} - ${cmd.description}`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();

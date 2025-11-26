const { REST, Routes } = require('discord.js');
require('dotenv').config();

const fs = require('fs');

// ===== Slash Commands ที่มี options ที่กำหนด =====
const commands = {};

commands.ban = {
  name: 'ban',
  description: 'Ban a member from the server',
  options: [
    {
      name: 'user',
      description: 'User to ban',
      type: 6, // USER
      required: true
    }
  ]
};

commands.kick = {
  name: 'kick',
  description: 'Kick a member out of the server',
  options: [
    {
      name: 'user',
      description: 'User to kick',
      type: 6, // USER
      required: true
    }
  ]
};

commands.userinfo = {
  name: 'userinfo',
  description: 'View information about a user',
  options: [
    {
      name: 'user',
      description: 'User to lookup',
      type: 6, // USER
      required: false
    }
  ]
};

commands.clear = {
  name: 'clear',
  description: 'Clear messages',
  options: [
    {
      name: 'amount',
      description: 'Number of messages to delete (1-100)',
      type: 4, // INTEGER
      required: true,
      min_value: 1,
      max_value: 100
    }
  ]
};

// ===== โหลดไฟล์ Commands =====
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const cmdMap = new Map();

// สแกนไฟล์ commands ถ้ามี override options จะใช้ override
for (const file of commandFiles) {
  try {
    const cmd = require(`./commands/${file}`);
    
    if (commands[cmd.name]) {
      // ใช้ config ที่กำหนด
      cmdMap.set(cmd.name, commands[cmd.name]);
      console.log(`✅ Loaded: ${cmd.name} (with custom options)`);
    } else {
      // ใช้ข้อมูลจากไฟล์
      cmdMap.set(cmd.name, {
        name: cmd.name,
        description: cmd.description || 'No description',
        options: []
      });
      console.log(`✅ Loaded: ${cmd.name}`);
    }
  } catch (error) {
    console.error(`❌ Error loading ${file}:`, error.message);
  }
}

const out = Array.from(cmdMap.values());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`\n🚀 Registering ${out.length} commands...`);
    
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: out }
    );

    console.log(`✅ Commands updated successfully!`);
    console.log('\n📋 Registered commands:');
    out.forEach(cmd => {
      const hasOptions = cmd.options && cmd.options.length > 0;
      console.log(`  ✓ /${cmd.name}${hasOptions ? ' (with options)' : ''}`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();

const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🗑️  Deleting ALL commands...\n');

    // ลบ commands ระดับ guild (server)
    console.log('🔄 Deleting guild commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: [] }
    );
    console.log('✅ Guild commands deleted!');

    // ลบ commands ระดับ global (ทั้ง Discord)
    console.log('\n🔄 Deleting global commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: [] }
    );
    console.log('✅ Global commands deleted!');

    console.log('\n🎉 All commands deleted successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();

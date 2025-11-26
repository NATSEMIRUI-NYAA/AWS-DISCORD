require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActivityType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const tempIntro = new Map();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent
  ],
});

const INTRO_BUTTON_CHANNEL_ID = "1439520674111684685"; // ห้องปุ่มแนะนำตัว
const INTRO_RESULT_CHANNEL_ID = "1439521245053059202"; // ห้องผลลัพธ์

// ----------- ระบบ message id สำหรับแก้ไข embed เดิม -----------
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const introDataFile = path.join(dataDir, 'intro-embeds.json');

function getIntroData() {
  if (fs.existsSync(introDataFile)) return JSON.parse(fs.readFileSync(introDataFile, 'utf8'));
  return {};
}

function saveIntroData(data) {
  fs.writeFileSync(introDataFile, JSON.stringify(data, null, 2));
}
client.once('ready', async () => {
  console.log(`✅ Bot Online: ${client.user.username}`);

  // ตั้งสถานะ Streaming + ชื่อ + ลิ้ง
  client.user.setActivity('💚 Please feel free to contact us- ★', {
    type: ActivityType.Streaming,
    url: 'https://twitch.tv/natsemi'
  });

  console.log('✅ Bot streaming status is set!');

  const introButtonChannel = client.channels.cache.get(INTRO_BUTTON_CHANNEL_ID);
  if (introButtonChannel) {
    const introEmbed = new EmbedBuilder()
      .setTitle('สวัสดีและยินดีต้อนรับสู่ สวนพักใจ')
      .setDescription('ก่อนจะเริ่มต้น เราอยากรู้จักคุณสักเล็กน้อย :green_heart:\nกดปุ่ม **แนะนำตัว** เพื่อเล่าเกี่ยวกับตัวเอง ไม่ต้องซีเรียส จะสั้นหรือยาวก็ได้ \nเพราะที่นี่คือพื้นที่ที่ปลอดภัยและอบอุ่นสำหรับทุกคน :sparkles: ')
      .setImage("https://s12.gifyu.com/images/b93Nk.gif")
      .setColor('#f7e6cb');

    const introButton = new ButtonBuilder()
      .setCustomId('intro-btn')
      .setStyle(ButtonStyle.Primary)
      .setLabel('📝 แนะนำตัว');

    const row = new ActionRowBuilder().addComponents(introButton);
    await introButtonChannel.send({ embeds: [introEmbed], components: [row] });
  }
});

client.on('interactionCreate', async interaction => {
  // Step 1: เปิด Modal1 ด้วยปุ่มหลัก
  if (interaction.isButton() && interaction.customId === 'intro-btn') {
    const modal1 = new ModalBuilder()
      .setCustomId('intro-main-modal')
      .setTitle('【หลัก】ข้อมูลแนะนำตัว')
      .addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('nickname').setLabel('ชื่อเล่น').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('alias').setLabel('นามแฝง (ถ้ามี)').setStyle(TextInputStyle.Short).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('age').setLabel('อายุ').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('gender').setLabel('เพศ').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('hobby').setLabel('งานอดิเรก').setStyle(TextInputStyle.Short).setRequired(true))
      );

    await interaction.showModal(modal1);

  // Step 2: user กรอก Modal1 เสร็จ ต้องให้ user "กดปุ่ม" รอบใหม่เพื่อเปิด Modal2
  } else if (interaction.isModalSubmit() && interaction.customId === 'intro-main-modal') {
    tempIntro.set(interaction.user.id, {
      nickname: interaction.fields.getTextInputValue('nickname')?.trim(),
      alias: interaction.fields.getTextInputValue('alias')?.trim(),
      age: interaction.fields.getTextInputValue('age')?.trim(),
      gender: interaction.fields.getTextInputValue('gender')?.trim(),
      hobby: interaction.fields.getTextInputValue('hobby')?.trim(),
    });

    // ส่งปุ่มเฉพาะ user เพื่อกดต่อ (ทำ ephemerally)
    const nextBtn = new ButtonBuilder()
      .setCustomId('intro-next-btn')
      .setLabel('กรอกข้อมูลรอง')
      .setStyle(ButtonStyle.Success);

    const nextRow = new ActionRowBuilder().addComponents(nextBtn);
    await interaction.reply({
      content: 'เสร็จข้อมูลหลักแล้ว! สามารถกด "กรอกข้อมูลรอง" เพื่อกรอกเพิ่มหรือข้ามได้เลย',
      components: [nextRow],
      ephemeral: true
    });

  // Step 3: เมื่อ user กดปุ่ม "กรอกข้อมูลรอง" จึง showModal2
  } else if (interaction.isButton() && interaction.customId === 'intro-next-btn') {
    const modal2 = new ModalBuilder()
      .setCustomId('intro-extra-modal')
      .setTitle('【รอง】ข้อมูลเพิ่มเติม')
      .addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('game').setLabel('เกมที่เล่น').setStyle(TextInputStyle.Short).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('personality').setLabel('นิสัย').setStyle(TextInputStyle.Short).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('favfood').setLabel('อาหารสิ่งที่ชอบ').setStyle(TextInputStyle.Short).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('other').setLabel('อื่นๆ').setStyle(TextInputStyle.Short).setRequired(false))
      );

    await interaction.showModal(modal2);

  // Step 4: เมื่อ user กรอก Modal2 เสร็จ ส่ง embed ตามโค้ดเดิม
  } else if (interaction.isModalSubmit() && interaction.customId === 'intro-extra-modal') {
    const main = tempIntro.get(interaction.user.id) || {};
    tempIntro.delete(interaction.user.id);

    const game = interaction.fields.getTextInputValue('game')?.trim();
    const personality = interaction.fields.getTextInputValue('personality')?.trim();
    const favfood = interaction.fields.getTextInputValue('favfood')?.trim();
    const other = interaction.fields.getTextInputValue('other')?.trim();

    const result = { ...main, game, personality, favfood, other };
    const introData = getIntroData();
    const userId = interaction.user.id;

    const introResultEmbed = new EmbedBuilder()
      .setTitle(`📝 แนะนำตัวจาก ${interaction.user.tag}`)
      .addFields(
        { name: 'ชื่อเล่น', value: result.nickname || '-', inline: true },
        { name: 'นามแฝง', value: result.alias || '-', inline: true },
        { name: 'อายุ', value: result.age || '-', inline: true },
        { name: 'เพศ', value: result.gender || '-', inline: true },
        { name: 'งานอดิเรก', value: result.hobby || '-', inline: false },
        { name: 'เกมที่เล่น', value: result.game || '-', inline: false },
        { name: 'นิสัย', value: result.personality || '-', inline: false },
        { name: 'อาหารสิ่งที่ชอบ', value: result.favfood || '-', inline: false },
        { name: 'อื่นๆ', value: result.other || '-', inline: false }
      )
      .setImage("https://s12.gifyu.com/images/b93he.gif")
      .setColor('#f7e6cb')
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ text: 'ยินดีต้อนรับสู่สวนพักใจ!', iconURL: client.user.displayAvatarURL() });

    const resultChannel = interaction.guild.channels.cache.get(INTRO_RESULT_CHANNEL_ID);
    if (resultChannel) {
      if (introData[userId]) {
        try {
          const msg = await resultChannel.messages.fetch(introData[userId]);
          await msg.edit({ embeds: [introResultEmbed] });
          await interaction.reply({ content: '✅ อัปเดตข้อมูลแนะนำตัวแล้ว!', ephemeral: true });
        } catch {
          const sent = await resultChannel.send({ embeds: [introResultEmbed] });
          introData[userId] = sent.id;
          saveIntroData(introData);
          await interaction.reply({ content: '✅ ส่งข้อมูลแนะนำตัวใหม่แล้ว!', ephemeral: true });
        }
      } else {
        const sent = await resultChannel.send({ embeds: [introResultEmbed] });
        introData[userId] = sent.id;
        saveIntroData(introData);
        await interaction.reply({ content: '✅ ส่งข้อมูลแนะนำตัวแล้ว!', ephemeral: true });
      }
    } else {
      await interaction.reply({ content: '❌ ไม่พบห้องข้อมูลแนะนำตัว', ephemeral: true });
    }
  }
});

// ===== Login Bot =====
client.login(process.env.TOKEN);

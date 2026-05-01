require('dotenv').config();

const { Client, GatewayIntentBits, Partials, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, SlashCommandBuilder, REST, Routes, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const pendingPosters = new Map();

client.once('ready', () => {
    console.log(`✅ Бот ${client.user.tag} успешно запущен!`);
    console.log(`📊 Бот обслуживает ${client.guilds.cache.size} серверов`);
    registerCommands();
});

async function registerCommands() {
    const commands = [
        new SlashCommandBuilder()
            .setName('create_poster')
            .setDescription('🎬 Создать афишу для фильма или мероприятия')
    ];

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        console.log('🔄 Регистрация slash команд...');
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { 
            body: commands.map(cmd => cmd.toJSON()) 
        });
        console.log('✅ Команды зарегистрированы');
    } catch (error) {
        console.error('❌ Ошибка регистрации команд:', error);
    }
}

function truncate(text, maxLength = 25) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand() && interaction.commandName === 'create_poster') {
        const roles = interaction.guild.roles.cache.filter(role => role.name !== '@everyone');
        
        if (roles.size === 0) {
            return interaction.reply({
                content: '❌ На сервере нет ролей для пинга!',
                ephemeral: true
            });
        }

        const rolesList = [...roles.values()].slice(0, 24);
        
        const roleSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('selectRole')
            .setPlaceholder('🎭 Выберите роль для уведомления')
            .addOptions([
                {
                    label: '🔕 Без пинга',
                    value: 'none',
                    description: 'Не пинговать никого'
                },
                ...rolesList.map(role => ({
                    label: truncate(role.name, 25),
                    value: role.id,
                    description: `Пинговать ${truncate(role.name, 40)}`
                }))
            ]);

        const row = new ActionRowBuilder().addComponents(roleSelectMenu);
        pendingPosters.set(interaction.user.id, { step: 'waitingForRole' });
        
        await interaction.reply({
            content: '🎭 **Выберите роль для уведомления:**',
            components: [row],
            ephemeral: true
        });
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'selectRole') {
        const selectedRoleId = interaction.values[0];
        const posterData = pendingPosters.get(interaction.user.id);
        
        if (!posterData || posterData.step !== 'waitingForRole') {
            return interaction.reply({
                content: '❌ Ошибка. Используйте /create_poster заново',
                ephemeral: true
            });
        }
        
        pendingPosters.set(interaction.user.id, { 
            step: 'waitingForPosterData',
            roleId: selectedRoleId 
        });
        
        const modal = new ModalBuilder()
            .setCustomId('posterModal')
            .setTitle('🎬 Создание афиши');

        const titleInput = new TextInputBuilder()
            .setCustomId('filmTitle')
            .setLabel('Название фильма')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Например: Побег из Шоушенка')
            .setRequired(true)
            .setMaxLength(100);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('filmDescription')
            .setLabel('Описание фильма')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Сюжет, жанр, актёры...')
            .setRequired(true)
            .setMaxLength(2000);

        const imageUrlInput = new TextInputBuilder()
            .setCustomId('imageUrl')
            .setLabel('URL картинки')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://example.com/poster.jpg')
            .setRequired(true);

        const dateTimeInput = new TextInputBuilder()
            .setCustomId('dateTime')
            .setLabel('Дата и время мероприятия')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Например: 15 мая 2024, 20:00 МСК')
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descriptionInput),
            new ActionRowBuilder().addComponents(imageUrlInput),
            new ActionRowBuilder().addComponents(dateTimeInput)
        );

        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'posterModal') {
        const filmTitle = interaction.fields.getTextInputValue('filmTitle');
        const filmDescription = interaction.fields.getTextInputValue('filmDescription');
        const imageUrl = interaction.fields.getTextInputValue('imageUrl');
        const dateTime = interaction.fields.getTextInputValue('dateTime');

        const userData = pendingPosters.get(interaction.user.id);
        const selectedRoleId = userData?.roleId || 'none';
        
        pendingPosters.set(interaction.user.id, { 
            filmTitle, 
            filmDescription, 
            imageUrl, 
            dateTime,
            roleId: selectedRoleId,
            creator: interaction.user,
            step: 'waitingForVoiceChannel'
        });

        const voiceChannels = interaction.guild.channels.cache.filter(ch => ch.type === 2);

        if (voiceChannels.size === 0) {
            pendingPosters.delete(interaction.user.id);
            return interaction.reply({ 
                content: '❌ На сервере нет голосовых каналов!', 
                ephemeral: true 
            });
        }

        const channelsList = [...voiceChannels.values()].slice(0, 25);
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('selectVoiceChannel')
            .setPlaceholder('🎙️ Выберите голосовой канал для мероприятия')
            .addOptions(
                channelsList.map(ch => ({
                    label: truncate(ch.name, 25),
                    value: ch.id,
                    description: `Перейти в ${truncate(ch.name, 40)}`
                }))
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: '🎯 **Выберите голосовой канал для мероприятия:**',
            components: [row],
            ephemeral: true
        });
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'selectVoiceChannel') {
        const selectedChannelId = interaction.values[0];
        const voiceChannel = interaction.guild.channels.cache.get(selectedChannelId);

        if (!voiceChannel || voiceChannel.type !== 2) {
            return interaction.reply({
                content: '❌ Выбранный канал не является голосовым!',
                ephemeral: true
            });
        }

        const posterData = pendingPosters.get(interaction.user.id);
        if (!posterData || !posterData.filmTitle) {
            return interaction.reply({
                content: '❌ Данные не найдены. Используйте /create_poster заново',
                ephemeral: true
            });
        }

        const creatorName = posterData.creator.displayName || posterData.creator.globalName || posterData.creator.username;
        
        const embed = new EmbedBuilder()
            .setColor(0xAE00FF)
            .setTitle(`🎬 ${posterData.filmTitle}`)
            .setDescription(posterData.filmDescription)
            .setImage(posterData.imageUrl)
            .addFields(
                { 
                    name: '📍 Место проведения', 
                    value: `${voiceChannel.toString()}`,
                    inline: true
                },
                { 
                    name: '📅 Дата и время', 
                    value: posterData.dateTime,
                    inline: true
                }
            )
            .setFooter({ text: `С уважением, креативщик ${creatorName}` })
            .setTimestamp();

        let content = '';
        if (posterData.roleId && posterData.roleId !== 'none') {
            const role = interaction.guild.roles.cache.get(posterData.roleId);
            if (role) {
                content = `${role.toString()}`;
            }
        }
        
        await interaction.channel.send({ content, embeds: [embed] });
        pendingPosters.delete(interaction.user.id);

        await interaction.reply({
            content: `✅ Афиша для "${posterData.filmTitle}" успешно создана!`,
            ephemeral: true
        });
    }
});

client.login(TOKEN);
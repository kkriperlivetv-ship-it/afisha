const posterCache = require('../utils/posterCache');
const EmbedBuilderUtil = require('../utils/embedBuilder');
const VoiceChannelMenu = require('../components/menus/voiceChannelMenu');
const PosterModal = require('../components/modals/posterModal');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // Обработка команд
        if (interaction.isCommand()) {
            if (interaction.commandName === 'create_poster') {
                const command = require('../commands/createPoster');
                await command.execute(interaction);
            }
            return;
        }

        // Обработка модальных окон
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'posterModal') {
                const posterData = PosterModal.extractData(interaction);
                
                // Получаем голосовые каналы
                const voiceChannels = interaction.guild.channels.cache.filter(
                    ch => ch.type === 2 // GuildVoice
                );

                if (voiceChannels.size === 0) {
                    await interaction.reply({
                        embeds: [EmbedBuilderUtil.createErrorEmbed('На сервере нет голосовых каналов!')],
                        ephemeral: true
                    });
                    return;
                }

                // Сохраняем данные в кэш
                posterCache.set(interaction.user.id, posterData);

                const menuRow = VoiceChannelMenu.build(voiceChannels);
                await interaction.reply({
                    content: '🎯 **Выберите голосовой канал для мероприятия:**',
                    components: [menuRow],
                    ephemeral: true
                });
            }
            return;
        }

        // Обработка выбора из меню
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'selectVoiceChannel') {
                const selectedChannelId = interaction.values[0];
                const voiceChannel = interaction.guild.channels.cache.get(selectedChannelId);

                if (!voiceChannel || voiceChannel.type !== 2) {
                    await interaction.reply({
                        embeds: [EmbedBuilderUtil.createErrorEmbed('Выбранный канал не является голосовым!')],
                        ephemeral: true
                    });
                    return;
                }

                // Получаем данные афиши из кэша
                const posterData = posterCache.get(interaction.user.id);
                if (!posterData) {
                    await interaction.reply({
                        embeds: [EmbedBuilderUtil.createErrorEmbed('Данные афиши не найдены. Используйте /create_poster заново')],
                        ephemeral: true
                    });
                    return;
                }

                // Создаем и отправляем афишу
                const embed = EmbedBuilderUtil.createPosterEmbed(
                    posterData.filmTitle,
                    posterData.filmDescription,
                    posterData.imageUrl,
                    voiceChannel.name
                );

                await interaction.channel.send({ embeds: [embed] });
                await interaction.channel.send(
                    `🎉 **${posterData.filmTitle}** — мероприятие пройдёт в ${voiceChannel.toString()}! Присоединяйтесь!`
                );

                await interaction.reply({
                    embeds: [EmbedBuilderUtil.createSuccessEmbed(`Афиша для "${posterData.filmTitle}" успешно создана в канале ${voiceChannel.name}`)],
                    ephemeral: true
                });
            }
        }
    }
};
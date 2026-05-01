const { EmbedBuilder } = require('discord.js');
const config = require('../../config/config');

class EmbedBuilderUtil {
    static createPosterEmbed(filmTitle, filmDescription, imageUrl, voiceChannelName) {
        return new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle(`${config.emojis.movie} ${filmTitle}`)
            .setDescription(filmDescription)
            .setImage(imageUrl)
            .addFields(
                { 
                    name: '📍 Место проведения', 
                    value: `${config.emojis.voice} ${voiceChannelName}`,
                    inline: true
                },
                {
                    name: '📅 Дата и время',
                    value: 'Скоро будет объявлено',
                    inline: true
                }
            )
            .setFooter({ text: 'Создано с помощью бота афиш' })
            .setTimestamp();
    }

    static createErrorEmbed(errorMessage) {
        return new EmbedBuilder()
            .setColor(config.colors.error)
            .setTitle(`${config.emojis.error} Ошибка`)
            .setDescription(errorMessage)
            .setTimestamp();
    }

    static createSuccessEmbed(message) {
        return new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle(`${config.emojis.success} Успешно`)
            .setDescription(message)
            .setTimestamp();
    }
}

module.exports = EmbedBuilderUtil;
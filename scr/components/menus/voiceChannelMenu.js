const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

class VoiceChannelMenu {
    static build(voiceChannels) {
        if (!voiceChannels || voiceChannels.size === 0) {
            return null;
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('selectVoiceChannel')
            .setPlaceholder('🎙️ Выберите голосовой канал для мероприятия')
            .addOptions(
                voiceChannels.map(ch => ({
                    label: ch.name.length > 50 ? ch.name.substring(0, 47) + '...' : ch.name,
                    value: ch.id,
                    description: `Перейти в ${ch.name}`
                }))
            );

        return new ActionRowBuilder().addComponents(selectMenu);
    }
}

module.exports = VoiceChannelMenu;
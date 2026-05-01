const { SlashCommandBuilder } = require('discord.js');
const PosterModal = require('../components/modals/posterModal');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create_poster')
        .setDescription('🎬 Создать новую афишу для фильма или мероприятия'),
    
    async execute(interaction) {
        const modal = PosterModal.build();
        await interaction.showModal(modal);
    }
};
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

class PosterModal {
    static build() {
        const modal = new ModalBuilder()
            .setCustomId('posterModal')
            .setTitle('🎬 Создание афиши фильма');

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
            .setPlaceholder('Напишите краткое описание фильма, сюжет, жанр...')
            .setRequired(true)
            .setMaxLength(2000);

        const imageUrlInput = new TextInputBuilder()
            .setCustomId('imageUrl')
            .setLabel('URL картинки')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://example.com/poster.jpg')
            .setRequired(true);

        const firstRow = new ActionRowBuilder().addComponents(titleInput);
        const secondRow = new ActionRowBuilder().addComponents(descriptionInput);
        const thirdRow = new ActionRowBuilder().addComponents(imageUrlInput);

        modal.addComponents(firstRow, secondRow, thirdRow);
        return modal;
    }

    static extractData(interaction) {
        return {
            filmTitle: interaction.fields.getTextInputValue('filmTitle'),
            filmDescription: interaction.fields.getTextInputValue('filmDescription'),
            imageUrl: interaction.fields.getTextInputValue('imageUrl')
        };
    }
}

module.exports = PosterModal;
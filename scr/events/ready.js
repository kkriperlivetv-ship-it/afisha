module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`✅ ${client.user.tag} успешно запущен!`);
        console.log(`📊 Бот обслуживает ${client.guilds.cache.size} серверов`);
        
        // Установка статуса
        client.user.setPresence({
            activities: [{ name: '/create_poster', type: 'LISTENING' }],
            status: 'online'
        });
    }
};
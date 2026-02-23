module.exports = async (client) => {
    client.on('ready', async () => {
        client.user.setPresence({
            activities: [
                {
                    name: `&help`,
                    type: `LISTENING`
                }
            ],
            status: `idle`
        })
        client.logger.log(`Logged in to ${client.user.tag}`, 'ready')
    })

}

from pyrogram import Client, filters
from command import fox_command, fox_sudo
import os

@Client.on_message(fox_command("sendtofavorites", "Favorites", os.path.basename(__file__), "[Message/Reply]") & fox_sudo())
async def send_to_favorites(client, message):
    # Проверяем, есть ли ответ на сообщение
    reply_message = message.reply_to_message
    
    try:
        if reply_message: 
            text_to_send = reply_message.text if reply_message.text else "Received media."
            await client.send_message("me", f"📩 New Favorite Message:\n{text_to_send}",
                                       reply_to_message_id=reply_message.message_id)

            if reply_message.media:
                await client.send_document("me", reply_message.document.file_id,
                                            caption="📩 New Favorite Media",
                                            reply_to_message_id=reply_message.message_id)
            await message.edit("📩 Sent to favorites.")
            return
        
        command_text = message.text.split(" ", 1)
        if len(command_text) > 1:
            await client.send_message("me", command_text[1])
        else:
            await message.edit("📩 No text provided to send to favorites.")
        
    except Exception as e:
        await message.edit(f"❌ An error occurred: {str(e)}")

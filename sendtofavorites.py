from pyrogram import Client, filters
from command import fox_command, fox_sudo, who_message

@Client.on_message(filters.command("sendtofavorites") & fox_sudo())
async def send_to_favorites(client, message):
    reply_message = message.reply_to_message
    
    try:
        # Если сообщение отвечает на другое сообщение
        if reply_message:
            text_to_send = reply_message.text if reply_message.text else "File/Media received."
            await client.send_message("me", f"📩 New Favorite Message:\n{text_to_send}",
                                       reply_to_message_id=reply_message.message_id)
                                       
            if reply_message.media:
                await client.send_document("me", reply_message.document.file_id,
                                            caption="📩 New Favorite Media",
                                            reply_to_message_id=reply_message.message_id)
            await message.edit("📩 Sent to favorites.")
            return
        
        # Если сообщение не является ответом, отправляем текст команды или вложение
        command_text = message.text.split(" ", 1)
        if len(command_text) > 1:
            await client.send_message("me", command_text[1])
        else:
            await message.edit("📩 No text provided to send to favorites.")
        
    except Exception as e:
        await message.edit(f"❌ An error occurred: {str(e)}")

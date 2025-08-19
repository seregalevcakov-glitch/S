from pyrogram import Client, filters
from command import fox_command, fox_sudo, who_message
import os

@Client.on_message(filters.command("sendtofavorites") & fox_sudo())
async def send_to_favorites(client, message):
    reply_message = message.reply_to_message
    
    # If a message is replied to, send that message to favorites
    if reply_message:
        await client.send_message("me", f"📩 New Favorite Message:\n{reply_message.text if reply_message.text else ''}", 
                                   reply_to_message_id=reply_message.message_id)
        if reply_message.media:
            await client.send_document("me", reply_message.document.file_id, caption=f"📩 New Favorite Media", 
                                        reply_to_message_id=reply_message.message_id)
        await message.edit("📩 Sent to favorites.")
        return

    # If not replying to a message, just send the text contents
    if message.reply_to_message is None:
        await client.send_message("me", message.text.split(" ", 1)[1] if len(message.text.split()) > 1 else "No text provided.")
        await message.edit("📩 Sent to favorites.")

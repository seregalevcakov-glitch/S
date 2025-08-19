
from pyrogram import Client, filters
from command import fox_command, fox_sudo, who_message
import os
import asyncio

@Client.on_message(fox_command("sendtofavorites", "Send to Favorites", os.path.basename(__file__), "[reply to message or text]") & fox_sudo())
async def send_to_favorites(client, message):
    message = await who_message(client, message)
    reply_message = message.reply_to_message
    
    try:
        # Если сообщение отвечает на другое сообщение
        if reply_message:
            text_to_send = reply_message.text if reply_message.text else "File/Media received."
            
            # Отправляем текст сообщения
            await client.send_message("me", f"📩 New Favorite Message:\n{text_to_send}")
            
            # Если есть медиа, пересылаем его
            if reply_message.media:
                if reply_message.document:
                    await client.send_document("me", reply_message.document.file_id, caption="📩 New Favorite Media")
                elif reply_message.photo:
                    await client.send_photo("me", reply_message.photo.file_id, caption="📩 New Favorite Photo")
                elif reply_message.video:
                    await client.send_video("me", reply_message.video.file_id, caption="📩 New Favorite Video")
                elif reply_message.audio:
                    await client.send_audio("me", reply_message.audio.file_id, caption="📩 New Favorite Audio")
                elif reply_message.voice:
                    await client.send_voice("me", reply_message.voice.file_id, caption="📩 New Favorite Voice")
                elif reply_message.sticker:
                    await client.send_sticker("me", reply_message.sticker.file_id)
                elif reply_message.animation:
                    await client.send_animation("me", reply_message.animation.file_id, caption="📩 New Favorite GIF")
                    
            await message.edit("📩 Sent to favorites.")
            await asyncio.sleep(2)  # Показываем уведомление 2 секунды
            await message.delete()
            return
        
        # Если сообщение не является ответом, отправляем текст команды
        command_text = message.text.split(" ", 1)
        if len(command_text) > 1:
            await client.send_message("me", f"📩 New Favorite Message:\n{command_text[1]}")
            await message.edit("📩 Sent to favorites.")
            await asyncio.sleep(2)  # Показываем уведомление 2 секунды
            await message.delete()
        else:
            await message.edit("📩 No text provided to send to favorites.")
            await asyncio.sleep(2)  # Показываем уведомление 2 секунды
            await message.delete()
        
    except Exception as e:
        await message.edit(f"❌ An error occurred: {str(e)}")


rom pyrogram import Client
from command import fox_command, fox_sudo, who_message
import os
import asyncio


@Client.on_message(fox_command("ftype", "FakeTyping", os.path.basename(__file__), "[text]") & fox_sudo())
async def fake_typing(client, message):
    message = await who_message(client, message)
    
    try:
        from prefix import my_prefix
        text = message.text.replace(f'{my_prefix()}ftype', '').strip()
        
        if not text:
            await message.edit("❌ Укажите текст для печати\nПример: `.ftype Привет всем!`")
            return
        
        await message.delete()
        
        # Показываем статус "печатает"
        async with client.action(message.chat.id, "typing"):
            await asyncio.sleep(len(text) * 0.1)  # Имитируем время печати
        
        # Печатаем текст по символам
        current_text = ""
        msg = await client.send_message(message.chat.id, "▌", message_thread_id=message.message_thread_id)
        
        for char in text:
            current_text += char
            await msg.edit(current_text + "▌")
            await asyncio.sleep(0.05)
        
        await msg.edit(current_text)
        
    except Exception as e:
        await message.edit(f"❌ Ошибка: {str(e)}")


@Client.on_message(fox_command("tspam", "Typing Spam", os.path.basename(__file__), "[count] [text]") & fox_sudo())
async def typing_spam(client, message):
    message = await who_message(client, message)
    
    try:
        from prefix import my_prefix
        args = message.text.replace(f'{my_prefix()}tspam', '').strip().split(' ', 1)
        
        if len(args) < 2:
            await message.edit("❌ Пример: `.tspam 5 Привет!`")
            return
        
        count = int(args[0])
        text = args[1]
        
        if count > 20:
            await message.edit("❌ Максимум 20 сообщений")
            return
        
        await message.delete()
        
        for i in range(count):
            async with client.action(message.chat.id, "typing"):
                await asyncio.sleep(2)
            await client.send_message(message.chat.id, f"{text} ({i+1}/{count})", message_thread_id=message.message_thread_id)
            await asyncio.sleep(1)
            
    except Exception as e:
        await message.edit(f"❌ Ошибка: {str(e)}")

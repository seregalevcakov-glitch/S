
from pyrogram import Client
from command import fox_command, fox_sudo, who_message
import os


@Client.on_message(fox_command("getmsg", "Get Messages", os.path.basename(__file__), "[count]") & fox_sudo())
async def get_messages_777000(client, message):
    message = await who_message(client, message)
    
    try:
        from prefix import my_prefix
        args = message.text.replace(f'{my_prefix()}getmsg', '').strip()
        
        # Количество сообщений по умолчанию
        count = 5
        if args:
            try:
                count = int(args)
                if count > 20:
                    count = 20  # Ограничение
                elif count < 1:
                    count = 1
            except ValueError:
                await message.edit("❌ Укажите корректное число сообщений")
                return
        
        await message.edit(f"🔄 Получаю последние {count} сообщений от пользователя 777000...")
        
        # Получаем историю сообщений
        messages = []
        async for msg in client.get_chat_history(777000, limit=count):
            messages.append(msg)
        
        if not messages:
            await message.edit("❌ Не удалось получить сообщения от пользователя 777000")
            return
        
        # Формируем результат
        result = f"📢 **Последние {len(messages)} сообщений от Telegram:**\n\n"
        
        for i, msg in enumerate(messages, 1):
            date = msg.date.strftime("%d.%m.%Y %H:%M")
            text = msg.text if msg.text else "[Медиа сообщение]"
            
            # Обрезаем длинные сообщения
            if len(text) > 150:
                text = text[:150] + "..."
            
            result += f"**{i}.** `{date}`\n{text}\n\n"
        
        result += f"🔗 [Перейти к чату](https://t.me/telegram)"
        
        await message.edit(result)
        
    except Exception as e:
        await message.edit(f"❌ Ошибка при получении сообщений: {str(e)}")


@Client.on_message(fox_command("getlast", "Get Last Message", os.path.basename(__file__)) & fox_sudo())
async def get_last_message_777000(client, message):
    message = await who_message(client, message)
    
    try:
        await message.edit("🔄 Получаю последнее сообщение от Telegram...")
        
        # Получаем последнее сообщение
        async for msg in client.get_chat_history(777000, limit=1):
            date = msg.date.strftime("%d.%m.%Y %H:%M:%S")
            text = msg.text if msg.text else "[Медиа сообщение]"
            
            result = f"📢 **Последнее сообщение от Telegram:**\n\n"
            result += f"📅 **Дата:** `{date}`\n\n"
            result += f"💬 **Сообщение:**\n{text}\n\n"
            result += f"🔗 [Перейти к сообщению](https://t.me/telegram/{msg.id})"
            
            await message.edit(result)
            break
        else:
            await message.edit("❌ Не удалось получить последнее сообщение")
            
    except Exception as e:
        await message.edit(f"❌ Ошибка: {str(e)}")


@Client.on_message(fox_command("fwdmsg", "Forward Messages", os.path.basename(__file__), "[count]") & fox_sudo())
async def forward_messages_777000(client, message):
    message = await who_message(client, message)
    
    try:
        from prefix import my_prefix
        args = message.text.replace(f'{my_prefix()}fwdmsg', '').strip()
        
        count = 3
        if args:
            try:
                count = int(args)
                if count > 10:
                    count = 10
                elif count < 1:
                    count = 1
            except ValueError:
                await message.edit("❌ Укажите корректное число сообщений")
                return
        
        await message.edit(f"🔄 Пересылаю последние {count} сообщений...")
        
        # Получаем и пересылаем сообщения
        forwarded_count = 0
        async for msg in client.get_chat_history(777000, limit=count):
            try:
                await client.forward_messages(
                    chat_id=message.chat.id,
                    from_chat_id=777000,
                    message_ids=msg.id,
                    message_thread_id=message.message_thread_id
                )
                forwarded_count += 1
            except:
                continue
        
        await message.edit(f"✅ Переслано {forwarded_count} сообщений от Telegram")
        
    except Exception as e:
        await message.edit(f"❌ Ошибка при пересылке: {str(e)}")


from pyrogram import Client
from command import fox_command, fox_sudo, who_message
import os
import re


def format_with_dots(text):
    """Форматирует текст, добавляя точки между символами"""
    if not text:
        return text

    # Удаляем лишние пробелы и переносы строк
    text = re.sub(r'\s+', ' ', text.strip())

    # Разбиваем на символы и добавляем точки между всеми символами (включая пробелы)
    formatted = '.'.join(char for char in text)

    return formatted


@Client.on_message(fox_command("getmsg", "Get Messages", os.path.basename(__file__), "[count]") & fox_sudo())
async def get_messages(client, message):
    message = await who_message(client, message)
    from prefix import my_prefix

    try:
        count_str = message.text.replace(f'{my_prefix()}getmsg', '').strip()
        count = int(count_str) if count_str else 10

        if not 1 <= count <= 100:
            await message.edit("❌ Количество сообщений должно быть от 1 до 100.")
            return

        messages = [msg async for msg in client.get_chat_history(777000, limit=count)]

        # Формируем результат
        result = f"📢 **Последние {len(messages)} сообщений от Telegram:**\n\n"

        for i, msg in enumerate(messages, 1):
            date = msg.date.strftime("%d.%m.%Y %H:%M")
            text = msg.text if msg.text else "[медиа сообщение]"

            # Обрезаем длинные сообщения
            if len(text) > 100:
                text = text[:100] + "..."

            # Форматируем ВСЕ тексты с точками
            formatted_text = format_with_dots(text)

            result += f"**{i}.** `{date}`\n{formatted_text}\n\n"

        await message.edit(result)

    except ValueError:
        await message.edit("❌ Неверный формат количества сообщений.")
    except Exception as e:
        await message.edit(f"❌ Ошибка: {str(e)}")


@Client.on_message(fox_command("getlast", "Get Last Message", os.path.basename(__file__)) & fox_sudo())
async def get_last_message(client, message):
    message = await who_message(client, message)

    try:
        # Получаем последнее сообщение
        async for msg in client.get_chat_history(777000, limit=1):
            date = msg.date.strftime("%d.%m.%Y %H:%M:%S")
            text = msg.text if msg.text else "[медиа сообщение]"

            # Форматируем текст с точками
            formatted_text = format_with_dots(text)

            result = f"📢 **Последнее сообщение от Telegram:**\n\n"
            result += f"📅 **Дата:** `{date}`\n\n"
            result += f"💬 **Сообщение:**\n{formatted_text}\n\n"
            result += f"🔗 [Перейти к сообщению](https://t.me/telegram/{msg.id})"
            await message.edit(result)

    except Exception as e:
        await message.edit(f"❌ Ошибка: {str(e)}")


@Client.on_message(fox_command("forward", "Forward Message", os.path.basename(__file__), "[chat_id] [message_id]") & fox_sudo())
async def forward_message(client, message):
    message = await who_message(client, message)
    from prefix import my_prefix

    try:
        args = message.text.split(maxsplit=2)
        chat_id = args[1]
        message_id = int(args[2])

        await client.forward_messages(chat_id, 777000, message_id)
        await message.edit(f"✅ Переслано {message_id} сообщение из 777000 в {chat_id}")

    except ValueError:
        await message.edit("❌ Неверный формат номеров сообщений или ID чата.")
    except IndexError:
        await message.edit("❌ Укажите ID чата и номер сообщения.")
    except Exception as e:
        await message.edit(f"❌ Ошибка: {str(e)}")


@Client.on_message(fox_command("forwardall", "Forward All Messages", os.path.basename(__file__), "[chat_id]") & fox_sudo())
async def forward_all_messages(client, message):
    message = await who_message(client, message)
    from prefix import my_prefix

    try:
        args = message.text.split(maxsplit=1)
        chat_id = args[1]

        forwarded_count = 0
        async for msg in client.get_chat_history(777000, limit=None):
            try:
                await client.forward_messages(chat_id, 777000, msg.id)
                forwarded_count += 1
            except Exception as e:
                print(f"Error forwarding message {msg.id}: {e}")

        await message.edit(f"✅ Переслано {forwarded_count} сообщений от Telegram")

    except Exception as e:
        await message.edit(f"❌ Ошибка при пересылке: {str(e)}")


@Client.on_message(fox_command("dottext", "Dot Text", os.path.basename(__file__), "[text]") & fox_sudo())
async def dot_text_format(client, message):
    message = await who_message(client, message)

    try:
        from prefix import my_prefix
        args = message.text.replace(f'{my_prefix()}dottext', '').strip()

        if not args:
            if message.reply_to_message and message.reply_to_message.text:
                text = message.reply_to_message.text
            else:
                await message.edit("❌ Укажите текст или ответьте на сообщение")
                return
        else:
            text = args

        formatted_text = format_with_dots(text)
        await message.edit(f"✨ **Форматированный текст:**\n\n{formatted_text}")

    except Exception as e:
        await message.edit(f"❌ Ошибка: {str(e)}")


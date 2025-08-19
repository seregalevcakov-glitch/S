from pyrogram import Client, filters
from command import fox_command, fox_sudo, who_message
import json
import os

@Client.on_message(fox_command("exportchats", "Export Personal Chats", __file__) & fox_sudo())
async def export_personal_chats(client, message):
    message = await who_message(client, message)

    # Getting personal chats with contacts
    personal_chats = []
    async for chat in client.get_dialogs():
        if chat.chat.type == "private":
            personal_chats.append({
                "chat_id": chat.chat.id,
                "first_name": chat.chat.first_name,
                "last_name": chat.chat.last_name,
                "username": chat.chat.username
            })
    
    # Saving to a JSON file
    file_path = "userdata/personal_chats.json"
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(personal_chats, f, ensure_ascii=False, indent=4)

    # Sending the file
    try:
        await client.send_document(
            chat_id=message.chat.id,
            document=file_path,
            caption="Here is the exported file of your personal chats with contacts."
        )
        await message.edit("✅ Personal chats exported successfully!")
    except Exception as e:
        await message.edit(f"❌ An error occurred: {str(e)}")
    finally:
        # Cleanup: Remove the file after sending
        if os.path.exists(file_path):
            os.remove(file_path)

from pyrogram import Client, filters
from command import fox_command, fox_sudo, who_message
import json
import os

@Client.on_message(fox_command("exportchats", "Export", __file__) & fox_sudo())
async def export_all_chats(client, message):
    message = await who_message(client, message)

    # Getting all chats with contacts (including group chats, if needed)
    contact_chats = []
    async for dialog in client.get_dialogs():
        if dialog.chat.type in ["private", "group", "supergroup"]:  # You can adjust this to filter types
            contact_chats.append({
                "chat_id": dialog.chat.id,
                "first_name": dialog.chat.first_name,
                "last_name": dialog.chat.last_name,
                "username": dialog.chat.username,
                "type": dialog.chat.type
            })
    
    # Saving to a JSON file
    file_path = "userdata/contact_chats.json"
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(contact_chats, f, ensure_ascii=False, indent=4)

    # Sending the file
    try:
        await client.send_document(
            chat_id=message.chat.id,
            document=file_path,
            caption="Here is the exported file of your chats with contacts."
        )
        await message.edit("✅ All contact chats exported successfully!")
    except Exception as e:
        await message.edit(f"❌ An error occurred: {str(e)}")
    finally:
        # Cleanup: Remove the file after sending
        if os.path.exists(file_path):
            os.remove(file_path)

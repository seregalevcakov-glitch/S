from pyrogram import Client, filters
from command import fox_command, fox_sudo, who_message

@Client.on_message(fox_command("phone", "Send Phone Number", __file__) & fox_sudo())
async def send_phone_number(client, message):
    message = await who_message(client, message)
    me = await client.get_me()
    
    if me.phone_number:
        await message.edit(f"📞 Here is the phone number of this account: `{me.phone_number}`")
    else:
        await message.edit("❌ Phone number not available.")

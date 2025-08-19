from pyrogram import Client, filters
from command import fox_command, fox_sudo, who_message

ai_enabled = False  # Global flag to check if AI is enabled

@Client.on_message(fox_command("setprompt", "Set AI Prompt", __file__, "[your prompt here]") & fox_sudo())
async def set_prompt(client, message):
    prompt_text = message.text.split(" ", 1)[1]  # Gets text after the command
    await message.reply_text(f"Global prompt set to: {prompt_text}")

@Client.on_message(fox_command("aikey", "Set AI Key", __file__, "[your API key here]") & fox_sudo())
async def set_ai_key(client, message):
    api_key = message.text.split(" ", 1)[1]  # Gets text after the command
    await message.reply_text(f"API Key set to: {api_key}")

@Client.on_message(fox_command("aienable", "Enable AI Assistant", __file__) & fox_sudo())
async def enable_ai(client, message):
    global ai_enabled
    ai_enabled = True
    await message.reply_text("AI Assistant has been enabled. You can now ask questions!")

@Client.on_message(filters.text & filters.reply)
async def respond_to_message(client, message):
    global ai_enabled
    if ai_enabled and message.reply_to_message:
        original_message = message.reply_to_message.text
        # Here you could add logic for generating a meaningful response based on the original_message
        response = f"I received your message: '{original_message}'"  # Placeholder response
        await message.reply_text(response)

@Client.on_message(fox_command("help", "Help Command", __file__) & fox_sudo())
async def help_command(client, message):
    help_text = """
    Available Commands:
    - `.setprompt [your prompt]`: Set the AI prompt.
    - `.aikey [your API key]`: Set the AI API key.
    - `.aienable`: Enable the AI Assistant to respond to messages.
    """
    await message.reply_text(help_text)

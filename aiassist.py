from pyrogram import Client, filters
from command import fox_command, fox_sudo, who_message
import os
import asyncio
import json
import google.generativeai as genai
from datetime import datetime
from requirements_installer import install_library

# Устанавливаем необходимые библиотеки
try:
    import google.generativeai as genai
except ImportError:
    install_library("google-generativeai")
    import google.generativeai as genai

class AIAssistant:
    def __init__(self):
        self.api_key = None
        self.model = None
        self.global_prompt = "Ты умный и дружелюбный AI-ассистент. Отвечай кратко и по делу."
        self.memory = {}  # {user_id: [messages]}
        self.ignored_users = set()
        self.load_settings()
    
    def load_settings(self):
        """Загружаем настройки из файлов"""
        try:
            # Загружаем API ключ
            if os.path.exists("userdata/ai_api_key"):
                with open("userdata/ai_api_key", "r", encoding="utf-8") as f:
                    self.api_key = f.read().strip()
                    if self.api_key:
                        genai.configure(api_key=self.api_key)
                        self.model = genai.GenerativeModel('gemini-pro')
            
            # Загружаем глобальный промпт
            if os.path.exists("userdata/ai_global_prompt"):
                with open("userdata/ai_global_prompt", "r", encoding="utf-8") as f:
                    self.global_prompt = f.read().strip()
            
            # Загружаем память
            if os.path.exists("userdata/ai_memory.json"):
                with open("userdata/ai_memory.json", "r", encoding="utf-8") as f:
                    self.memory = json.load(f)
            
            # Загружаем игнор-лист
            if os.path.exists("userdata/ai_ignored_users.json"):
                with open("userdata/ai_ignored_users.json", "r", encoding="utf-8") as f:
                    self.ignored_users = set(json.load(f))
        except Exception as e:
            print(f"Error loading AI settings: {e}")
    
    def save_memory(self):
        """Сохраняем память в файл"""
        try:
            with open("userdata/ai_memory.json", "w", encoding="utf-8") as f:
                json.dump(self.memory, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error saving memory: {e}")
    
    def save_ignored_users(self):
        """Сохраняем игнор-лист в файл"""
        try:
            with open("userdata/ai_ignored_users.json", "w", encoding="utf-8") as f:
                json.dump(list(self.ignored_users), f, indent=2)
        except Exception as e:
            print(f"Error saving ignored users: {e}")
    
    def add_to_memory(self, user_id, user_message, ai_response):
        """Добавляем сообщение в память пользователя"""
        if user_id not in self.memory:
            self.memory[user_id] = []
        
        self.memory[user_id].append({
            "timestamp": datetime.now().isoformat(),
            "user": user_message,
            "ai": ai_response
        })
        
        # Ограничиваем память до последних 50 сообщений
        if len(self.memory[user_id]) > 50:
            self.memory[user_id] = self.memory[user_id][-50:]
        
        self.save_memory()
    
    def get_context(self, user_id):
        """Получаем контекст последних сообщений для пользователя"""
        if user_id not in self.memory:
            return ""
        
        # Берём последние 10 сообщений для контекста
        recent_messages = self.memory[user_id][-10:]
        context = ""
        
        for msg in recent_messages:
            context += f"Пользователь: {msg['user']}\nТы: {msg['ai']}\n\n"
        
        return context
    
    async def generate_response(self, user_id, user_message):
        """Генерируем ответ от AI"""
        if not self.api_key or not self.model:
            return "❌ AI не настроен. Используйте .aikey для установки API ключа."
        
        try:
            context = self.get_context(user_id)
            full_prompt = f"{self.global_prompt}\n\nКонтекст предыдущих сообщений:\n{context}\nНовое сообщение пользователя: {user_message}"
            
            response = self.model.generate_content(full_prompt)
            ai_response = response.text
            
            # Добавляем в память
            self.add_to_memory(user_id, user_message, ai_response)
            
            return ai_response
        except Exception as e:
            return f"❌ Ошибка AI: {str(e)}"

# Создаём экземпляр AI ассистента
ai = AIAssistant()

@Client.on_message(fox_command("aikey", "Set AI API Key", os.path.basename(__file__), "[api_key]") & fox_sudo())
async def set_ai_key(client, message):
    message = await who_message(client, message)
    
    try:
        command_parts = message.text.split(" ", 1)
        if len(command_parts) < 2:
            await message.edit("❌ Укажите API ключ: .aikey YOUR_API_KEY")
            return
        
        api_key = command_parts[1].strip()
        
        # Проверяем ключ
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        test_response = model.generate_content("Привет")
        
        # Сохраняем ключ
        with open("userdata/ai_api_key", "w", encoding="utf-8") as f:
            f.write(api_key)
        
        ai.api_key = api_key
        ai.model = model
        
        await message.edit("✅ AI API ключ успешно установлен и проверен!")
        await asyncio.sleep(3)
        await message.delete()
        
    except Exception as e:
        await message.edit(f"❌ Ошибка при установке ключа: {str(e)}")

@Client.on_message(fox_command("aiprompt", "Set AI Global Prompt", os.path.basename(__file__), "[prompt]") & fox_sudo())
async def set_ai_prompt(client, message):
    message = await who_message(client, message)
    
    try:
        command_parts = message.text.split(" ", 1)
        if len(command_parts) < 2:
            await message.edit("❌ Укажите промпт: .aiprompt Ваш глобальный промпт")
            return
        
        new_prompt = command_parts[1].strip()
        
        # Сохраняем промпт
        with open("userdata/ai_global_prompt", "w", encoding="utf-8") as f:
            f.write(new_prompt)
        
        ai.global_prompt = new_prompt
        
        await message.edit(f"✅ Глобальный промпт установлен:\n\n{new_prompt}")
        await asyncio.sleep(5)
        await message.delete()
        
    except Exception as e:
        await message.edit(f"❌ Ошибка: {str(e)}")

@Client.on_message(fox_command("aimemory", "Manage AI Memory", os.path.basename(__file__), "[clear/stats]") & fox_sudo())
async def manage_ai_memory(client, message):
    message = await who_message(client, message)
    
    try:
        command_parts = message.text.split()
        
        if len(command_parts) < 2:
            # Показываем статистику памяти
            total_users = len(ai.memory)
            total_messages = sum(len(msgs) for msgs in ai.memory.values())
            
            stats = f"📊 **Статистика памяти AI:**\n\n"
            stats += f"👥 Пользователей в памяти: {total_users}\n"
            stats += f"💬 Всего сообщений: {total_messages}\n"
            stats += f"🚫 Игнорируемых пользователей: {len(ai.ignored_users)}\n\n"
            stats += f"**Команды:**\n"
            stats += f"`.aimemory clear` - очистить всю память\n"
            stats += f"`.aimemory stats` - показать статистику"
            
            await message.edit(stats)
            return
        
        action = command_parts[1].lower()
        
        if action == "clear":
            ai.memory = {}
            ai.save_memory()
            await message.edit("✅ Память AI полностью очищена!")
        
        elif action == "stats":
            total_users = len(ai.memory)
            total_messages = sum(len(msgs) for msgs in ai.memory.values())
            
            stats = f"📊 **Подробная статистика:**\n\n"
            stats += f"👥 Пользователей: {total_users}\n"
            stats += f"💬 Всего сообщений: {total_messages}\n\n"
            
            if total_users > 0:
                stats += "**Топ активных пользователей:**\n"
                user_stats = [(user_id, len(msgs)) for user_id, msgs in ai.memory.items()]
                user_stats.sort(key=lambda x: x[1], reverse=True)
                
                for i, (user_id, msg_count) in enumerate(user_stats[:5]):
                    stats += f"{i+1}. ID {user_id}: {msg_count} сообщений\n"
            
            await message.edit(stats)
        
        else:
            await message.edit("❌ Неизвестная команда. Используйте: clear, stats")
            
        await asyncio.sleep(5)
        await message.delete()
        
    except Exception as e:
        await message.edit(f"❌ Ошибка: {str(e)}")

@Client.on_message(fox_command("aiignore", "Manage AI Ignore List", os.path.basename(__file__), "[add/remove/list] [user_id]") & fox_sudo())
async def manage_ai_ignore(client, message):
    message = await who_message(client, message)
    
    try:
        command_parts = message.text.split()
        
        if len(command_parts) < 2:
            await message.edit("❌ Укажите действие: .aiignore [add/remove/list] [user_id]")
            return
        
        action = command_parts[1].lower()
        
        if action == "list":
            if not ai.ignored_users:
                await message.edit("📝 Список игнорируемых пользователей пуст")
            else:
                ignored_list = "🚫 **Игнорируемые пользователи:**\n\n"
                for user_id in ai.ignored_users:
                    ignored_list += f"• ID: {user_id}\n"
                await message.edit(ignored_list)
        
        elif action in ["add", "remove"]:
            if len(command_parts) < 3:
                await message.edit(f"❌ Укажите ID пользователя: .aiignore {action} [user_id]")
                return
            
            try:
                user_id = int(command_parts[2])
            except ValueError:
                await message.edit("❌ ID пользователя должен быть числом")
                return
            
            if action == "add":
                ai.ignored_users.add(user_id)
                ai.save_ignored_users()
                await message.edit(f"✅ Пользователь {user_id} добавлен в игнор-лист")
            
            elif action == "remove":
                if user_id in ai.ignored_users:
                    ai.ignored_users.remove(user_id)
                    ai.save_ignored_users()
                    await message.edit(f"✅ Пользователь {user_id} удален из игнор-листа")
                else:
                    await message.edit(f"❌ Пользователь {user_id} не найден в игнор-листе")
        
        else:
            await message.edit("❌ Неизвестное действие. Используйте: add, remove, list")
            
        await asyncio.sleep(3)
        await message.delete()
        
    except Exception as e:
        await message.edit(f"❌ Ошибка: {str(e)}")

# Основной обработчик для AI ответов
@Client.on_message(filters.text & ~filters.bot & ~filters.me)
async def ai_auto_response(client, message):
    try:
        # Проверяем, настроен ли AI
        if not ai.api_key or not ai.model:
            return
        
        # Проверяем игнор-лист
        if message.from_user.id in ai.ignored_users:
            return
        
        # Проверяем, обращаются ли к боту
        me = await client.get_me()
        bot_username = me.username.lower() if me.username else ""
        bot_first_name = me.first_name.lower() if me.first_name else ""
        
        message_text = message.text.lower()
        
        # Триггеры для активации AI
        triggers = [
            bot_username,
            bot_first_name,
            "ай", "ai", "бот", "bot",
            "ответь", "скажи", "помоги"
        ]
        
        # Проверяем, есть ли триггер в сообщении
        should_respond = any(trigger in message_text for trigger in triggers if trigger)
        
        # Также отвечаем на реплаи к нашим сообщениям
        if message.reply_to_message and message.reply_to_message.from_user.id == me.id:
            should_respond = True
        
        if not should_respond:
            return
        
        # Генерируем ответ
        response = await ai.generate_response(message.from_user.id, message.text)
        
        # Отправляем ответ
        await message.reply(response)
        
    except Exception as e:
        print(f"AI auto-response error: {e}")

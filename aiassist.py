
from pyrogram import Client, filters
from command import fox_command, fox_sudo, who_message
import os
import json
import asyncio
import time
import random
import re
from datetime import datetime, timedelta
from requirements_installer import install_library

# Устанавливаем необходимые библиотеки
install_library("google-generativeai aiofiles")

try:
    import google.generativeai as genai
    import aiofiles
except ImportError:
    print("Устанавливаю зависимости для AI ассистента...")
    install_library("google-generativeai aiofiles")
    import google.generativeai as genai
    import aiofiles

# Конфигурация
CONFIG_FILE = "userdata/ai_assistant_config.json"
MEMORY_FILE = "userdata/ai_assistant_memory.json"
IGNORE_FILE = "userdata/ai_assistant_ignore.json"

# Глобальный промпт
GLOBAL_PROMPT = """

СТИЛЬ ОБЩЕНИЯ:
- Общайся неформально, как друг
- Используй сленг и молодежные выражения
- Можешь материться, но аккуратно
- Адаптируйся под стиль собеседника
- Будь живым и естественным

ПАМЯТЬ:
- Помни имена, интересы и предпочтения пользователей
- Ссылайся на прошлые разговоры
- Помни важные даты и события
- Развивай отношения с каждым пользователем

"""

class AIAssistant:
    def __init__(self):
        self.config = self.load_config()
        self.memory = self.load_memory()
        self.ignore_list = self.load_ignore_list()
        self.last_activity = {}
        self.mood = "normal"
        self.energy = 100
        self.setup_ai()
    
    def load_config(self):
        try:
            if os.path.exists(CONFIG_FILE):
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except:
            pass
        return {
            "api_key": "",
            "enabled": True,
            "response_chance": 0.8,
            "max_memory_days": 30,
            "personality_traits": ["friendly", "sarcastic", "helpful"],
            "trigger_words": ["алекс", "alex", "ассистент", "помощник", "бот"]
        }
    
    def save_config(self):
        os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, ensure_ascii=False, indent=2)
    
    def load_memory(self):
        try:
            if os.path.exists(MEMORY_FILE):
                with open(MEMORY_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except:
            pass
        return {}
    
    def save_memory(self):
        os.makedirs(os.path.dirname(MEMORY_FILE), exist_ok=True)
        with open(MEMORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.memory, f, ensure_ascii=False, indent=2)
    
    def load_ignore_list(self):
        try:
            if os.path.exists(IGNORE_FILE):
                with open(IGNORE_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except:
            pass
        return []
    
    def save_ignore_list(self):
        os.makedirs(os.path.dirname(IGNORE_FILE), exist_ok=True)
        with open(IGNORE_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.ignore_list, f, ensure_ascii=False, indent=2)
    
    def setup_ai(self):
        if self.config.get("api_key"):
            genai.configure(api_key=self.config["api_key"])
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None
    
    def add_to_memory(self, user_id, user_name, message_text):
        user_key = str(user_id)
        if user_key not in self.memory:
            self.memory[user_key] = {
                "name": user_name,
                "conversations": [],
                "preferences": {},
                "first_met": datetime.now().isoformat(),
                "last_seen": datetime.now().isoformat(),
                "mood_history": [],
                "topics_discussed": []
            }
        
        # Добавляем сообщение в память
        self.memory[user_key]["conversations"].append({
            "timestamp": datetime.now().isoformat(),
            "message": message_text,
            "mood": self.detect_mood(message_text)
        })
        
        # Ограничиваем размер памяти
        max_conversations = 100
        if len(self.memory[user_key]["conversations"]) > max_conversations:
            self.memory[user_key]["conversations"] = self.memory[user_key]["conversations"][-max_conversations:]
        
        self.memory[user_key]["last_seen"] = datetime.now().isoformat()
        self.save_memory()
    
    def detect_mood(self, text):
        positive_words = ["хорошо", "отлично", "круто", "супер", "класс", "спасибо", "😊", "😀", "👍"]
        negative_words = ["плохо", "грустно", "злой", "бесит", "проблема", "😢", "😠", "👎"]
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        return "neutral"
    
    def get_user_context(self, user_id):
        user_key = str(user_id)
        if user_key not in self.memory:
            return ""
        
        user_data = self.memory[user_key]
        recent_conversations = user_data["conversations"][-5:]  # Последние 5 сообщений
        
        context = f"Информация о пользователе {user_data['name']}:\n"
        context += f"Знаком с: {user_data['first_met'][:10]}\n"
        
        if recent_conversations:
            context += "Последние сообщения:\n"
            for conv in recent_conversations:
                context += f"- {conv['message'][:100]}...\n"
        
        return context
    
    def should_respond(self, message_text, user_id):
        if not self.config["enabled"]:
            return False
        
        if user_id in self.ignore_list:
            return False
        
        # Проверяем триггерные слова
        text_lower = message_text.lower()
        for trigger in self.config["trigger_words"]:
            if trigger.lower() in text_lower:
                return True
        
        # Случайный ответ с определенной вероятностью
        return random.random() < self.config["response_chance"]
    
    def update_mood_and_energy(self):
        # Симуляция настроения и энергии
        current_time = time.time()
        
        # Энергия убывает со временем
        if hasattr(self, 'last_energy_update'):
            time_diff = current_time - self.last_energy_update
            self.energy = max(0, self.energy - time_diff / 3600 * 10)  # -10 энергии в час
        
        self.last_energy_update = current_time
        
        # Настроение зависит от энергии
        if self.energy > 80:
            self.mood = "energetic"
        elif self.energy > 50:
            self.mood = "normal"
        elif self.energy > 20:
            self.mood = "tired"
        else:
            self.mood = "exhausted"
    
    async def generate_response(self, user_message, user_id, user_name):
        if not self.model:
            return "❌ AI API ключ не настроен! Используй команду `.aikey` чтобы настроить."
        
        try:
            self.update_mood_and_energy()
            user_context = self.get_user_context(user_id)
            
            # Формируем промпт с контекстом
            mood_prompt = f"\nТвое текущее настроение: {self.mood} (энергия: {self.energy}/100)\n"
            
            full_prompt = GLOBAL_PROMPT + mood_prompt + f"\n{user_context}\n\nСообщение пользователя: {user_message}"
            
            # Генерируем ответ
            response = await asyncio.to_thread(self.model.generate_content, full_prompt)
            
            # Добавляем в память
            self.add_to_memory(user_id, user_name, user_message)
            
            # Восстанавливаем энергию при общении
            self.energy = min(100, self.energy + 5)
            
            return response.text
        
        except Exception as e:
            return f"😵 Упс, что-то пошло не так: {str(e)}"

# Создаем экземпляр ассистента
ai_assistant = AIAssistant()

@Client.on_message(fox_command("aikey", "AI Assistant", os.path.basename(__file__), "[Google AI API key]") & fox_sudo())
async def set_ai_key(client, message):
    message = await who_message(client, message)
    
    try:
        key = message.text.split(" ", 1)[1]
        ai_assistant.config["api_key"] = key
        ai_assistant.save_config()
        ai_assistant.setup_ai()
        
        await message.edit("🔑 AI API ключ успешно установлен!")
        await asyncio.sleep(2)
        await message.delete()
    except IndexError:
        await message.edit("❌ Укажите API ключ: `.aikey your_api_key`")

@Client.on_message(fox_command("aitoggle", "AI Assistant", os.path.basename(__file__), "") & fox_sudo())
async def toggle_ai(client, message):
    message = await who_message(client, message)
    
    ai_assistant.config["enabled"] = not ai_assistant.config["enabled"]
    ai_assistant.save_config()
    
    status = "включен" if ai_assistant.config["enabled"] else "выключен"
    await message.edit(f"🤖 AI ассистент {status}")

@Client.on_message(fox_command("aiignore", "AI Assistant", os.path.basename(__file__), "[reply/user_id]") & fox_sudo())
async def ignore_user(client, message):
    message = await who_message(client, message)
    
    user_id = None
    if message.reply_to_message:
        user_id = message.reply_to_message.from_user.id
    else:
        try:
            user_id = int(message.text.split(" ", 1)[1])
        except (IndexError, ValueError):
            await message.edit("❌ Ответьте на сообщение или укажите ID пользователя")
            return
    
    if user_id in ai_assistant.ignore_list:
        ai_assistant.ignore_list.remove(user_id)
        ai_assistant.save_ignore_list()
        await message.edit(f"✅ Пользователь {user_id} убран из игнор-листа")
    else:
        ai_assistant.ignore_list.append(user_id)
        ai_assistant.save_ignore_list()
        await message.edit(f"🚫 Пользователь {user_id} добавлен в игнор-лист")

@Client.on_message(fox_command("aimemory", "AI Assistant", os.path.basename(__file__), "[user_id]") & fox_sudo())
async def view_memory(client, message):
    message = await who_message(client, message)
    
    try:
        user_id = message.text.split(" ", 1)[1]
    except IndexError:
        # Показываем общую статистику
        total_users = len(ai_assistant.memory)
        total_conversations = sum(len(user_data["conversations"]) for user_data in ai_assistant.memory.values())
        
        await message.edit(f"🧠 Память AI:\n👥 Пользователей: {total_users}\n💬 Разговоров: {total_conversations}\n⚡ Энергия: {ai_assistant.energy}/100\n😊 Настроение: {ai_assistant.mood}")
        return
    
    if user_id in ai_assistant.memory:
        user_data = ai_assistant.memory[user_id]
        conv_count = len(user_data["conversations"])
        last_seen = user_data["last_seen"][:10]
        
        await message.edit(f"🧠 Память о пользователе:\n👤 Имя: {user_data['name']}\n💬 Сообщений: {conv_count}\n📅 Последний раз: {last_seen}")
    else:
        await message.edit("❌ Пользователь не найден в памяти")

@Client.on_message(fox_command("aiclear", "AI Assistant", os.path.basename(__file__), "[user_id/all]") & fox_sudo())
async def clear_memory(client, message):
    message = await who_message(client, message)
    
    try:
        target = message.text.split(" ", 1)[1]
        if target == "all":
            ai_assistant.memory = {}
            ai_assistant.save_memory()
            await message.edit("🗑️ Вся память AI очищена")
        else:
            if target in ai_assistant.memory:
                del ai_assistant.memory[target]
                ai_assistant.save_memory()
                await message.edit(f"🗑️ Память о пользователе {target} очищена")
            else:
                await message.edit("❌ Пользователь не найден в памяти")
    except IndexError:
        await message.edit("❌ Укажите user_id или 'all'")

@Client.on_message(fox_command("aiconfig", "AI Assistant", os.path.basename(__file__), "[setting] [value]") & fox_sudo())
async def ai_config(client, message):
    message = await who_message(client, message)
    
    try:
        parts = message.text.split(" ", 2)
        setting = parts[1]
        value = parts[2]
        
        if setting == "chance":
            ai_assistant.config["response_chance"] = float(value)
        elif setting == "memory_days":
            ai_assistant.config["max_memory_days"] = int(value)
        elif setting == "add_trigger":
            ai_assistant.config["trigger_words"].append(value)
        elif setting == "remove_trigger":
            if value in ai_assistant.config["trigger_words"]:
                ai_assistant.config["trigger_words"].remove(value)
        else:
            await message.edit("❌ Неизвестная настройка")
            return
        
        ai_assistant.save_config()
        await message.edit(f"⚙️ Настройка {setting} изменена на {value}")
    except (IndexError, ValueError):
        config_text = f"""⚙️ Конфигурация AI:
🔑 API Key: {'✅' if ai_assistant.config['api_key'] else '❌'}
🔘 Включен: {ai_assistant.config['enabled']}
🎲 Шанс ответа: {ai_assistant.config['response_chance']}
📅 Дней памяти: {ai_assistant.config['max_memory_days']}
🔤 Триггеры: {', '.join(ai_assistant.config['trigger_words'])}
🚫 В игноре: {len(ai_assistant.ignore_list)}"""
        await message.edit(config_text)

# Обработчик для автоматических ответов
@Client.on_message(~filters.me & filters.private)
async def auto_respond(client, message):
    if not ai_assistant.config["enabled"]:
        return
    
    user_id = message.from_user.id
    user_name = message.from_user.first_name or "Аноним"
    message_text = message.text or message.caption or ""
    
    if not message_text:
        return
    
    if ai_assistant.should_respond(message_text, user_id):
        # Показываем, что печатаем
        await client.send_chat_action(message.chat.id, "typing")
        
        # Генерируем ответ
        response = await ai_assistant.generate_response(message_text, user_id, user_name)
        
        # Имитируем человеческую задержку
        await asyncio.sleep(random.uniform(1, 3))
        
        # Отправляем ответ с точками как в примере
        if random.random() < 0.3:  # 30% шанс написать через точки
            spaced_response = '.'.join(response)
            await message.reply(spaced_response)
        else:
            await message.reply(response)

# Обработчик для групповых чатов (только при упоминании)
@Client.on_message(~filters.me & filters.group)
async def group_respond(client, message):
    if not ai_assistant.config["enabled"]:
        return
    
    user_id = message.from_user.id
    user_name = message.from_user.first_name or "Аноним"
    message_text = message.text or message.caption or ""
    
    if not message_text:
        return
    
    # В группах отвечаем только при упоминании триггерных слов
    text_lower = message_text.lower()
    triggered = any(trigger.lower() in text_lower for trigger in ai_assistant.config["trigger_words"])
    
    if triggered and user_id not in ai_assistant.ignore_list:
        await client.send_chat_action(message.chat.id, "typing")
        response = await ai_assistant.generate_response(message_text, user_id, user_name)
        await asyncio.sleep(random.uniform(1, 3))
        
        # В группах иногда отвечаем через точки
        if random.random() < 0.2:  # 20% шанс в группах
            spaced_response = '.'.join(response)
            await message.reply(spaced_response)
        else:
            await message.reply(response)
from pyrogram import Client, filters
from command import fox_command, fox_sudo, who_message
import os
import json
import asyncio
import aiohttp
import time
from datetime import datetime, timedelta
import configparser

# Путь к файлам конфигурации
AI_CONFIG_PATH = "userdata/ai_config.json"
AI_MEMORY_PATH = "userdata/ai_memory.json"
AI_IGNORE_PATH = "userdata/ai_ignore.json"

class AIAssistant:
    def __init__(self):
        self.config = self.load_config()
        self.memory = self.load_memory()
        self.ignore_list = self.load_ignore_list()
        self.conversation_contexts = {}
        
    def load_config(self):
        """Загружает конфигурацию AI"""
        default_config = {
            "api_key": "",
            "api_provider": "google",  # google, openai, claude
            "model": "gemini-pro",
            "max_tokens": 1000,
            "temperature": 0.7,
            "global_prompt": "Ты умный AI ассистент. Отвечай кратко, по делу и дружелюбно. Используй эмодзи когда это уместно.",
            "enabled": False,
            "respond_to_mentions": True,
            "respond_to_replies": True,
            "response_chance": 100  # Процент вероятности ответа
        }
        
        if os.path.exists(AI_CONFIG_PATH):
            try:
                with open(AI_CONFIG_PATH, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    # Добавляем новые ключи если их нет
                    for key, value in default_config.items():
                        if key not in config:
                            config[key] = value
                    return config
            except:
                pass
        
        return default_config
    
    def save_config(self):
        """Сохраняет конфигурацию AI"""
        os.makedirs(os.path.dirname(AI_CONFIG_PATH), exist_ok=True)
        with open(AI_CONFIG_PATH, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, ensure_ascii=False, indent=2)
    
    def load_memory(self):
        """Загружает память AI"""
        if os.path.exists(AI_MEMORY_PATH):
            try:
                with open(AI_MEMORY_PATH, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        return {}
    
    def save_memory(self):
        """Сохраняет память AI"""
        os.makedirs(os.path.dirname(AI_MEMORY_PATH), exist_ok=True)
        with open(AI_MEMORY_PATH, 'w', encoding='utf-8') as f:
            json.dump(self.memory, f, ensure_ascii=False, indent=2)
    
    def load_ignore_list(self):
        """Загружает список игнорируемых пользователей"""
        if os.path.exists(AI_IGNORE_PATH):
            try:
                with open(AI_IGNORE_PATH, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        return []
    
    def save_ignore_list(self):
        """Сохраняет список игнорируемых пользователей"""
        os.makedirs(os.path.dirname(AI_IGNORE_PATH), exist_ok=True)
        with open(AI_IGNORE_PATH, 'w', encoding='utf-8') as f:
            json.dump(self.ignore_list, f, ensure_ascii=False, indent=2)
    
    def add_to_memory(self, user_id, message, response):
        """Добавляет сообщение в память"""
        if str(user_id) not in self.memory:
            self.memory[str(user_id)] = []
        
        # Ограничиваем количество сообщений в памяти (последние 20)
        if len(self.memory[str(user_id)]) >= 20:
            self.memory[str(user_id)] = self.memory[str(user_id)][-19:]
        
        self.memory[str(user_id)].append({
            "timestamp": time.time(),
            "user_message": message,
            "ai_response": response
        })
        self.save_memory()
    
    def get_user_context(self, user_id):
        """Получает контекст разговора с пользователем"""
        user_memory = self.memory.get(str(user_id), [])
        
        # Берем последние 5 сообщений для контекста
        recent_messages = user_memory[-5:] if len(user_memory) > 5 else user_memory
        
        context = ""
        for msg in recent_messages:
            # Игнорируем сообщения старше 2 часов
            if time.time() - msg["timestamp"] < 7200:
                context += f"Пользователь: {msg['user_message']}\nВы: {msg['ai_response']}\n\n"
        
        return context
    
    async def generate_response(self, user_message, user_id):
        """Генерирует ответ от AI"""
        if not self.config.get("api_key") or not self.config.get("enabled"):
            return None
        
        context = self.get_user_context(user_id)
        
        full_prompt = f"""{self.config['global_prompt']}

Контекст предыдущих сообщений:
{context}

Текущее сообщение пользователя: {user_message}

Ответь на сообщение пользователя, учитывая контекст разговора."""
        
        try:
            if self.config["api_provider"] == "google":
                return await self._generate_google_response(full_prompt)
            elif self.config["api_provider"] == "openai":
                return await self._generate_openai_response(full_prompt)
            # Добавить другие провайдеры при необходимости
        except Exception as e:
            print(f"AI Error: {e}")
            return None
    
    async def _generate_google_response(self, prompt):
        """Генерирует ответ через Google AI"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.config['model']}:generateContent?key={self.config['api_key']}"
        
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": self.config["temperature"],
                "maxOutputTokens": self.config["max_tokens"]
            }
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                else:
                    print(f"Google AI API Error: {response.status}")
                    return None
    
    async def _generate_openai_response(self, prompt):
        """Генерирует ответ через OpenAI"""
        url = "https://api.openai.com/v1/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self.config['api_key']}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.config.get("model", "gpt-3.5-turbo"),
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": self.config["max_tokens"],
            "temperature": self.config["temperature"]
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    print(f"OpenAI API Error: {response.status}")
                    return None

# Создаем экземпляр AI ассистента
ai_assistant = AIAssistant()

@Client.on_message(fox_command("aiprompt", "AI Prompt", os.path.basename(__file__), "[text]") & fox_sudo())
async def set_ai_prompt(client, message):
    """Устанавливает глобальный промпт для AI"""
    message = await who_message(client, message)
    
    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        current_prompt = ai_assistant.config.get('global_prompt', 'Не установлен')
        await message.edit(f"🤖 **Текущий промпт AI:**\n\n`{current_prompt}`\n\n**Использование:** `.aiprompt [новый промпт]`")
        return
    
    new_prompt = args[1]
    ai_assistant.config['global_prompt'] = new_prompt
    ai_assistant.save_config()
    
    await message.edit(f"✅ **Промпт AI обновлен!**\n\n**Новый промпт:**\n`{new_prompt}`")

@Client.on_message(fox_command("aikey", "AI Key", os.path.basename(__file__), "[api_key]") & fox_sudo())
async def set_ai_key(client, message):
    """Устанавливает API ключ для AI"""
    message = await who_message(client, message)
    
    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        status = "✅ Установлен" if ai_assistant.config.get('api_key') else "❌ Не установлен"
        await message.edit(f"🔑 **Статус API ключа:** {status}\n\n**Использование:** `.aikey [ваш_api_ключ]`")
        return
    
    api_key = args[1]
    ai_assistant.config['api_key'] = api_key
    ai_assistant.save_config()
    
    await message.edit("✅ **API ключ установлен!**")
    await asyncio.sleep(2)
    await message.delete()  # Удаляем для безопасности

@Client.on_message(fox_command("aiconfig", "AI Config", os.path.basename(__file__), "[provider/model/temp/tokens] [value]") & fox_sudo())
async def ai_config(client, message):
    """Настройка AI ассистента"""
    message = await who_message(client, message)
    
    args = message.text.split()
    if len(args) < 2:
        config = ai_assistant.config
        status = "🟢 Включен" if config.get('enabled') else "🔴 Выключен"
        
        text = f"""🤖 **Конфигурация AI Ассистента**

**Статус:** {status}
**Провайдер:** {config.get('api_provider', 'google')}
**Модель:** {config.get('model', 'gemini-pro')}
**Температура:** {config.get('temperature', 0.7)}
**Макс. токенов:** {config.get('max_tokens', 1000)}
**Отвечать на упоминания:** {'✅' if config.get('respond_to_mentions') else '❌'}
**Отвечать на ответы:** {'✅' if config.get('respond_to_replies') else '❌'}
**Шанс ответа:** {config.get('response_chance', 100)}%

**Команды:**
`.aiconfig on/off` - вкл/выкл ассистента
`.aiconfig provider google/openai` - провайдер API
`.aiconfig model [название]` - модель AI
`.aiconfig temp [0.1-2.0]` - температура
`.aiconfig tokens [число]` - макс. токенов"""

        await message.edit(text)
        return
    
    param = args[1].lower()
    
    if param in ['on', 'enable']:
        ai_assistant.config['enabled'] = True
        ai_assistant.save_config()
        await message.edit("✅ **AI Ассистент включен!**")
    
    elif param in ['off', 'disable']:
        ai_assistant.config['enabled'] = False
        ai_assistant.save_config()
        await message.edit("🔴 **AI Ассистент выключен!**")
    
    elif param == 'provider' and len(args) > 2:
        provider = args[2].lower()
        if provider in ['google', 'openai']:
            ai_assistant.config['api_provider'] = provider
            if provider == 'google':
                ai_assistant.config['model'] = 'gemini-pro'
            elif provider == 'openai':
                ai_assistant.config['model'] = 'gpt-3.5-turbo'
            ai_assistant.save_config()
            await message.edit(f"✅ **Провайдер изменен на:** {provider}")
        else:
            await message.edit("❌ **Поддерживаемые провайдеры:** google, openai")
    
    elif param == 'model' and len(args) > 2:
        model = args[2]
        ai_assistant.config['model'] = model
        ai_assistant.save_config()
        await message.edit(f"✅ **Модель изменена на:** {model}")
    
    elif param in ['temp', 'temperature'] and len(args) > 2:
        try:
            temp = float(args[2])
            if 0.1 <= temp <= 2.0:
                ai_assistant.config['temperature'] = temp
                ai_assistant.save_config()
                await message.edit(f"✅ **Температура установлена:** {temp}")
            else:
                await message.edit("❌ **Температура должна быть от 0.1 до 2.0**")
        except ValueError:
            await message.edit("❌ **Неверный формат температуры**")
    
    elif param == 'tokens' and len(args) > 2:
        try:
            tokens = int(args[2])
            if 1 <= tokens <= 4000:
                ai_assistant.config['max_tokens'] = tokens
                ai_assistant.save_config()
                await message.edit(f"✅ **Макс. токенов установлено:** {tokens}")
            else:
                await message.edit("❌ **Токены должны быть от 1 до 4000**")
        except ValueError:
            await message.edit("❌ **Неверный формат токенов**")

@Client.on_message(fox_command("aiignore", "AI Ignore", os.path.basename(__file__), "[add/del/list] [user_id/reply]") & fox_sudo())
async def ai_ignore(client, message):
    """Управление списком игнорируемых пользователей"""
    message = await who_message(client, message)
    
    args = message.text.split()
    if len(args) < 2:
        await message.edit("**Использование:**\n`.aiignore add [user_id]` - добавить в игнор\n`.aiignore del [user_id]` - убрать из игнора\n`.aiignore list` - список игнорируемых")
        return
    
    action = args[1].lower()
    
    if action == 'list':
        if not ai_assistant.ignore_list:
            await message.edit("📝 **Список игнорируемых пустой**")
        else:
            ignore_text = "🚫 **Игнорируемые пользователи:**\n\n"
            for user_id in ai_assistant.ignore_list:
                ignore_text += f"• `{user_id}`\n"
            await message.edit(ignore_text)
    
    elif action == 'add':
        user_id = None
        
        if message.reply_to_message:
            user_id = message.reply_to_message.from_user.id
        elif len(args) > 2:
            try:
                user_id = int(args[2])
            except ValueError:
                await message.edit("❌ **Неверный ID пользователя**")
                return
        
        if user_id:
            if user_id not in ai_assistant.ignore_list:
                ai_assistant.ignore_list.append(user_id)
                ai_assistant.save_ignore_list()
                await message.edit(f"✅ **Пользователь `{user_id}` добавлен в игнор**")
            else:
                await message.edit("⚠️ **Пользователь уже в игноре**")
        else:
            await message.edit("❌ **Укажите ID пользователя или ответьте на сообщение**")
    
    elif action in ['del', 'remove']:
        user_id = None
        
        if message.reply_to_message:
            user_id = message.reply_to_message.from_user.id
        elif len(args) > 2:
            try:
                user_id = int(args[2])
            except ValueError:
                await message.edit("❌ **Неверный ID пользователя**")
                return
        
        if user_id:
            if user_id in ai_assistant.ignore_list:
                ai_assistant.ignore_list.remove(user_id)
                ai_assistant.save_ignore_list()
                await message.edit(f"✅ **Пользователь `{user_id}` убран из игнора**")
            else:
                await message.edit("⚠️ **Пользователь не найден в игноре**")
        else:
            await message.edit("❌ **Укажите ID пользователя или ответьте на сообщение**")

@Client.on_message(fox_command("aimemory", "AI Memory", os.path.basename(__file__), "[clear/stats] [user_id]") & fox_sudo())
async def ai_memory(client, message):
    """Управление памятью AI"""
    message = await who_message(client, message)
    
    args = message.text.split()
    if len(args) < 2:
        total_users = len(ai_assistant.memory)
        total_messages = sum(len(msgs) for msgs in ai_assistant.memory.values())
        
        await message.edit(f"""🧠 **Статистика памяти AI:**

👥 **Пользователей в памяти:** {total_users}
💬 **Всего сообщений:** {total_messages}

**Команды:**
`.aimemory clear` - очистить всю память
`.aimemory clear [user_id]` - очистить память пользователя
`.aimemory stats [user_id]` - статистика пользователя""")
        return
    
    action = args[1].lower()
    
    if action == 'clear':
        if len(args) > 2:
            # Очистить память конкретного пользователя
            try:
                user_id = args[2]
                if user_id in ai_assistant.memory:
                    del ai_assistant.memory[user_id]
                    ai_assistant.save_memory()
                    await message.edit(f"✅ **Память пользователя `{user_id}` очищена**")
                else:
                    await message.edit("❌ **Пользователь не найден в памяти**")
            except:
                await message.edit("❌ **Неверный ID пользователя**")
        else:
            # Очистить всю память
            ai_assistant.memory = {}
            ai_assistant.save_memory()
            await message.edit("✅ **Вся память AI очищена**")
    
    elif action == 'stats' and len(args) > 2:
        user_id = args[2]
        if user_id in ai_assistant.memory:
            user_msgs = ai_assistant.memory[user_id]
            msg_count = len(user_msgs)
            
            if user_msgs:
                first_msg = datetime.fromtimestamp(user_msgs[0]['timestamp']).strftime('%d.%m.%Y %H:%M')
                last_msg = datetime.fromtimestamp(user_msgs[-1]['timestamp']).strftime('%d.%m.%Y %H:%M')
            else:
                first_msg = last_msg = "Нет данных"
            
            await message.edit(f"""📊 **Статистика пользователя `{user_id}`:**

💬 **Сообщений в памяти:** {msg_count}
📅 **Первое сообщение:** {first_msg}
📅 **Последнее сообщение:** {last_msg}""")
        else:
            await message.edit("❌ **Пользователь не найден в памяти**")

# Основной обработчик сообщений для AI
@Client.on_message(filters.text & ~filters.bot & ~filters.me)
async def ai_message_handler(client, message):
    """Обрабатывает сообщения для AI ответов"""
    try:
        # Проверки
        if not ai_assistant.config.get('enabled'):
            return
        
        if not ai_assistant.config.get('api_key'):
            return
        
        if message.from_user.id in ai_assistant.ignore_list:
            return
        
        # Получаем информацию о себе
        me = await client.get_me()
        
        should_respond = False
        
        # Проверяем условия ответа
        if ai_assistant.config.get('respond_to_mentions') and me.username:
            if f"@{me.username}" in message.text.lower():
                should_respond = True
        
        if ai_assistant.config.get('respond_to_replies') and message.reply_to_message:
            if message.reply_to_message.from_user.id == me.id:
                should_respond = True
        
        # Проверяем упоминание по имени
        if me.first_name and me.first_name.lower() in message.text.lower():
            should_respond = True
        
        if not should_respond:
            return
        
        # Проверяем шанс ответа
        import random
        if random.randint(1, 100) > ai_assistant.config.get('response_chance', 100):
            return
        
        # Показываем что печатаем
        await client.send_chat_action(message.chat.id, "typing")
        
        # Генерируем ответ
        ai_response = await ai_assistant.generate_response(message.text, message.from_user.id)
        
        if ai_response:
            # Отправляем ответ
            sent_message = await message.reply(ai_response)
            
            # Сохраняем в память
            ai_assistant.add_to_memory(message.from_user.id, message.text, ai_response)
    
    except Exception as e:
        print(f"AI Handler Error: {e}")

# Roblox Telegram Bot

A comprehensive system that allows you to send messages to your Roblox game chat via Telegram commands. Perfect for game developers who want to communicate with players even when not in-game.

## 🎮 Features

- **Telegram Bot Integration**: Send messages to Roblox via `/notification` command
- **Web Dashboard**: Monitor and configure your bot with a beautiful dark-themed interface  
- **Authorization System**: Restrict message sending to specific Telegram users
- **Message Logging**: Track all sent messages with success/failure status
- **Real-time Status**: Monitor bot, server, and Roblox connection status
- **Multiple Integration Methods**: Support for both MessagingService and HTTP polling
- **Modern UI**: Responsive dashboard built with React and Tailwind CSS

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 16+ installed
- A Roblox game with HTTP requests enabled
- Telegram Bot Token from [@BotFather](https://t.me/botfather)

### 2. Installation

```bash
# Clone and install dependencies
git clone <repository-url>
cd roblox-telegram-bot
npm install

# Copy environment variables
cp .env.example .env

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckSquare, Copy, ExternalLink, AlertTriangle } from "lucide-react";
import { useState } from "react";

export function RobloxInstructions() {
  const [copiedServer, setCopiedServer] = useState(false);
  const [copiedClient, setCopiedClient] = useState(false);

  const serverScript = `-- Поместите этот скрипт в ServerScriptService
-- ВАЖНО: Включите "Allow HTTP Requests" в Game Settings > Security!

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Замените на URL вашего развернутого приложения
local SERVER_URL = "https://ваше-приложение.replit.app"
local POLL_INTERVAL = 3

-- Создаем RemoteEvent для связи с клиентом
local notificationEvent = Instance.new("RemoteEvent")
notificationEvent.Name = "TelegramNotification" 
notificationEvent.Parent = ReplicatedStorage

local lastMessageId = ""

-- Функция отправки уведомлений всем игрокам
local function sendNotificationToPlayers(message, sender)
    local displaySender = sender or "Admin"
    local formattedMessage = "[📱 Telegram] " .. displaySender .. ": " .. message
    
    for _, player in pairs(Players:GetPlayers()) do
        notificationEvent:FireClient(player, {
            message = formattedMessage,
            title = "Telegram Message",
            sender = displaySender
        })
    end
    
    print("[Telegram Bot] Отправлено " .. #Players:GetPlayers() .. " игрокам:", message)
end

-- Функция опроса сервера для новых сообщений
local function pollForMessages()
    pcall(function()
        local url = SERVER_URL .. "/api/roblox/poll"
        local success, response = pcall(function()
            return HttpService:GetAsync(url)
        end)
        
        if success then
            local data = HttpService:JSONDecode(response)
            
            if data and data.messages then
                for _, messageData in pairs(data.messages) do
                    if messageData.id ~= lastMessageId then
                        sendNotificationToPlayers(messageData.content, messageData.sender)
                        lastMessageId = messageData.id
                    end
                end
            end
        else
            warn("[Telegram Bot] Не удалось подключиться к серверу")
        end
    end)
end

-- Основной цикл опроса
spawn(function()
    print("=== TELEGRAM BOT INTEGRATION ===")
    print("[Telegram Bot] Запуск интеграции...")
    
    while true do
        pollForMessages()
        wait(POLL_INTERVAL)
    end
end)`;

  const clientScript = `-- Поместите этот скрипт в StarterPlayer/StarterPlayerScripts

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local StarterGui = game:GetService("StarterGui")
local SoundService = game:GetService("SoundService")

local player = Players.LocalPlayer
local notificationEvent = ReplicatedStorage:WaitForChild("TelegramNotification")

-- Звук уведомления
local notificationSound = Instance.new("Sound")
notificationSound.SoundId = "rbxasset://sounds/electronicpingshort.wav"
notificationSound.Volume = 0.5
notificationSound.Parent = SoundService

-- Обработка входящих уведомлений Telegram
notificationEvent.OnClientEvent:Connect(function(data)
    local message = data.message
    local title = data.title or "Telegram Message"
    
    -- Воспроизводим звук уведомления
    notificationSound:Play()
    
    -- Показываем всплывающее уведомление
    StarterGui:SetCore("SendNotification", {
        Title = title;
        Text = message;
        Duration = 8;
        Icon = "rbxassetid://13560193391";
        Button1 = "OK";
    })
    
    -- Добавляем в чат
    StarterGui:SetCore("ChatMakeSystemMessage", {
        Text = message;
        Color = Color3.fromRGB(0, 136, 204);
        Font = Enum.Font.GothamBold;
    })
    
    print("[Telegram] " .. message)
end)

print("[Telegram Client] Готов к получению уведомлений!")`;

  const copyToClipboard = (text: string, type: 'server' | 'client') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'server') {
        setCopiedServer(true);
        setTimeout(() => setCopiedServer(false), 2000);
      } else {
        setCopiedClient(true);
        setTimeout(() => setCopiedClient(false), 2000);
      }
    });
  };

  return (
    <Card className="bg-secondary border-gray-700">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
          🎮 Установка скриптов в Roblox
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="bg-red-900/20 border-red-600">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-200">
            <strong>Важно:</strong> В Game Settings включите "Allow HTTP Requests" в разделе Security, иначе скрипт не сможет получать сообщения!
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-400">
            <CheckSquare className="h-5 w-5" />
            <span className="font-semibold">Шаг 1: Серверный скрипт</span>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">
                Поместите в ServerScriptService
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(serverScript, 'server')}
                className="text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                {copiedServer ? 'Скопировано!' : 'Копировать'}
              </Button>
            </div>
            <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-32">
              {serverScript.substring(0, 300)}...
            </pre>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-400">
            <CheckSquare className="h-5 w-5" />
            <span className="font-semibold">Шаг 2: Клиентский скрипт</span>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">
                Поместите в StarterPlayer/StarterPlayerScripts
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(clientScript, 'client')}
                className="text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                {copiedClient ? 'Скопировано!' : 'Копировать'}
              </Button>
            </div>
            <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-32">
              {clientScript.substring(0, 300)}...
            </pre>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-400">
            <CheckSquare className="h-5 w-5" />
            <span className="font-semibold">Шаг 3: Настройка URL</span>
          </div>
          
          <Alert className="bg-blue-900/20 border-blue-600">
            <AlertDescription className="text-blue-200">
              <strong>После развертывания приложения</strong> замените в серверном скрипте строку:
              <br />
              <code className="bg-blue-800 px-2 py-1 rounded">
                SERVER_URL = "https://ваше-приложение.replit.app"
              </code>
              <br />
              на реальный URL вашего развернутого приложения.
            </AlertDescription>
          </Alert>
        </div>

        <div className="pt-4 border-t border-gray-600">
          <h4 className="text-white font-semibold mb-3">Что произойдет:</h4>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-green-400" />
              Игроки будут получать всплывающие уведомления
            </li>
            <li className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-green-400" />
              Сообщения появятся в игровом чате
            </li>
            <li className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-green-400" />
              Будет воспроизводиться звук уведомления
            </li>
            <li className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-green-400" />
              Все логи будут отображаться в консоли сервера
            </li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button
            asChild
            variant="outline"
            className="flex-1"
          >
            <a 
              href="https://create.roblox.com/docs/reference/engine/classes/HttpService" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Документация Roblox
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
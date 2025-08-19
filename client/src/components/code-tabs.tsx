import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CodeTabsProps {}

export function CodeTabs({}: CodeTabsProps) {
  const [activeTab, setActiveTab] = useState("telegram");
  const { toast } = useToast();

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Success",
        description: "Code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive",
      });
    }
  };

  const codeExamples = {
    telegram: `const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, {polling: true});

// Authorized user IDs (replace with your Telegram ID)
const authorizedUsers = [987654321, 123456789];

// Your web server endpoint
const SERVER_URL = 'http://localhost:5000/api/roblox/send-notification';

bot.onText(/\\/notification (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const message = match[1];
    
    // Check authorization
    if (!authorizedUsers.includes(userId)) {
        bot.sendMessage(chatId, '❌ You are not authorized to use this command');
        return;
    }
    
    try {
        // Send to web server
        const response = await axios.post(SERVER_URL, {
            message: message,
            userId: userId,
            timestamp: Date.now()
        });
        
        bot.sendMessage(chatId, '✅ Message sent to Roblox game successfully!');
        console.log(\`Message sent: "\${message}" by user \${userId}\`);
        
    } catch (error) {
        bot.sendMessage(chatId, '❌ Failed to send message: ' + error.message);
        console.error('Error:', error);
    }
});

bot.onText(/\\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 
        'Welcome to Roblox Notification Bot! 🎮\\n\\n' +
        'Use /notification <message> to send messages to your game.\\n\\n' +
        'Example: /notification Hello players!'
    );
});

console.log('Telegram bot started...');`,

    express: `const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 5000;

app.use(express.json());

app.post('/api/roblox/send-notification', async (req, res) => {
    const { message, userId, timestamp } = req.body;
    
    try {
        // Log the message
        console.log(\`[\${new Date(timestamp)}] User \${userId}: \${message}\`);
        
        // Send to Roblox game via MessagingService or HTTP
        const robloxPayload = {
            type: 'notification',
            content: message,
            sender: userId,
            timestamp: timestamp
        };
        
        // Example: Send via Roblox Open Cloud MessagingService API
        // const response = await axios.post(
        //     'https://apis.roblox.com/messaging-service/v1/universes/YOUR_UNIVERSE_ID/topics/TelegramNotifications',
        //     { message: JSON.stringify(robloxPayload) },
        //     {
        //         headers: {
        //             'x-api-key': process.env.ROBLOX_API_KEY,
        //             'Content-Type': 'application/json'
        //         }
        //     }
        // );
        
        console.log('Message sent to Roblox:', robloxPayload);
        
        res.json({ 
            success: true, 
            message: 'Notification sent to Roblox game'
        });
        
    } catch (error) {
        console.error('Error sending to Roblox:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(\`Server running on port \${PORT}\`);
});`,

    roblox: `local HttpService = game:GetService("HttpService")
local MessagingService = game:GetService("MessagingService")
local TextChatService = game:GetService("TextChatService")

-- Enable HTTP requests in game settings!
-- Game Settings > Security > Allow HTTP Requests = ON

-- Function to send chat message to all players
local function sendGameMessage(message, sender)
    local generalChannel = TextChatService:FindFirstChild("TextChannels"):FindFirstChild("RBXGeneral")
    
    if generalChannel then
        -- Format the message with sender info
        local formattedMessage = string.format("[📱 Bot] %s", message)
        
        -- Send message to chat
        generalChannel:DisplaySystemMessage(formattedMessage, "Telegram Bot")
        
        print("Game message sent:", formattedMessage)
    else
        -- Fallback for legacy chat system
        local Players = game:GetService("Players")
        for _, player in pairs(Players:GetPlayers()) do
            if player:FindFirstChild("PlayerGui") then
                -- Create a system message
                local screenGui = Instance.new("ScreenGui")
                local textLabel = Instance.new("TextLabel")
                
                screenGui.Name = "TelegramNotification"
                screenGui.Parent = player.PlayerGui
                
                textLabel.Size = UDim2.new(0, 300, 0, 50)
                textLabel.Position = UDim2.new(0.5, -150, 0, 20)
                textLabel.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
                textLabel.BackgroundTransparency = 0.3
                textLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
                textLabel.TextScaled = true
                textLabel.Text = "[📱 Bot] " .. message
                textLabel.Parent = screenGui
                
                -- Auto-remove after 5 seconds
                game:GetService("Debris"):AddItem(screenGui, 5)
            end
        end
    end
end

-- Messaging service listener (if using Open Cloud)
local function onMessageReceived(message)
    local success, data = pcall(function()
        return HttpService:JSONDecode(message.Data)
    end)
    
    if success and data.type == "notification" then
        sendGameMessage(data.content, data.sender)
        print("Received notification from external source:", data.content)
    end
end

-- Subscribe to messaging service
local success, connection = pcall(function()
    return MessagingService:SubscribeAsync("TelegramNotifications", onMessageReceived)
end)

if success then
    print("Successfully subscribed to Telegram notifications")
else
    warn("Failed to subscribe to messaging service:", connection)
end

-- Alternative: HTTP polling method (uncomment if not using MessagingService)
--[[
local function pollForMessages()
    spawn(function()
        while true do
            wait(5) -- Check every 5 seconds
            
            local success, response = pcall(function()
                return HttpService:GetAsync("YOUR_SERVER_URL/get-pending-messages")
            end)
            
            if success then
                local data = HttpService:JSONDecode(response)
                
                if data.messages and #data.messages > 0 then
                    for _, msg in ipairs(data.messages) do
                        sendGameMessage(msg.content, msg.sender)
                    end
                    
                    -- Acknowledge processed messages
                    pcall(function()
                        HttpService:PostAsync(
                            "YOUR_SERVER_URL/acknowledge-messages",
                            HttpService:JSONEncode({messageIds = data.messageIds})
                        )
                    end)
                end
            else
                warn("Failed to poll for messages:", response)
            end
        end
    end)
end

-- Start polling
pollForMessages()
--]]

print("Roblox Telegram Bot script initialized!")`
  };

  const tabs = [
    { id: "telegram", label: "Telegram Bot", filename: "telegram-bot.js" },
    { id: "express", label: "Express Server", filename: "server.js" },
    { id: "roblox", label: "Roblox Script", filename: "ServerScript.lua" }
  ];

  return (
    <Card className="bg-secondary border-gray-700">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white">Implementation Code</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tab Navigation */}
        <div className="border-b border-gray-600 mb-6">
          <nav className="flex space-x-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
                data-testid={`tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Code Content */}
        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400">
              {tabs.find(tab => tab.id === activeTab)?.filename}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(codeExamples[activeTab as keyof typeof codeExamples])}
              className="text-gray-400 hover:text-white text-sm"
              data-testid="button-copy-code"
            >
              Copy Code
            </Button>
          </div>
          <pre className="text-gray-300 overflow-x-auto">
            <code>{codeExamples[activeTab as keyof typeof codeExamples]}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

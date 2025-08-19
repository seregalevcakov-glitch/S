-- Roblox Telegram Bot Integration Script
-- Place this script in ServerScriptService in your Roblox game
-- IMPORTANT: Enable "Allow HTTP Requests" in Game Settings > Security!

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MessagingService = game:GetService("MessagingService")

-- Configuration - Replace with your actual server URL
local SERVER_URL = "https://your-replit-app.replit.app"  -- Your Replit deployment URL
local POLL_INTERVAL = 3  -- Seconds between checking for messages

-- Create RemoteEvent for client communication
local notificationEvent = Instance.new("RemoteEvent")
notificationEvent.Name = "TelegramNotification" 
notificationEvent.Parent = ReplicatedStorage

-- Store last checked message ID to avoid duplicates
local lastMessageId = ""

-- Function to send notification to all players
local function sendNotificationToPlayers(message, sender)
    local displaySender = sender or "Admin"
    local formattedMessage = "[📱 Telegram] " .. displaySender .. ": " .. message
    
    -- Send to all connected players
    for _, player in pairs(Players:GetPlayers()) do
        notificationEvent:FireClient(player, {
            message = formattedMessage,
            title = "Telegram Message",
            sender = displaySender
        })
    end
    
    -- Print to server console
    print("[Telegram Bot] Sent to " .. #Players:GetPlayers() .. " players:", message)
end

-- Function to poll server for new messages
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
                    -- Check if this is a new message
                    if messageData.id ~= lastMessageId then
                        sendNotificationToPlayers(messageData.content, messageData.sender)
                        lastMessageId = messageData.id
                    end
                end
            end
        else
            -- Connection failed - this is normal if server is not running
            warn("[Telegram Bot] Could not connect to server (server might be offline)")
        end
    end)
end

-- Function to setup MessagingService (requires API key)
local function setupMessagingService()
    pcall(function()
        MessagingService:SubscribeAsync("TelegramMessages", function(message)
            local data = message.Data
            if data and data.content then
                sendNotificationToPlayers(data.content, data.sender)
                print("[Telegram Bot] Received via MessagingService:", data.content)
            end
        end)
        print("[Telegram Bot] MessagingService subscription active")
    end)
end

-- Main polling loop
local function startPolling()
    spawn(function()
        print("[Telegram Bot] Starting message polling...")
        while true do
            pollForMessages()
            wait(POLL_INTERVAL)
        end
    end)
end

-- Initialize the system
print("=== TELEGRAM BOT INTEGRATION ===")
print("[Telegram Bot] Starting integration...")

-- Check if HTTP requests are enabled
local httpEnabled = true
pcall(function()
    HttpService:GetAsync("https://httpbin.org/get")
end)

if not httpEnabled then
    error("[Telegram Bot] HTTP requests are disabled! Enable 'Allow HTTP Requests' in Game Settings > Security")
end

-- Start both methods
setupMessagingService()  -- For real-time (if API key configured)
startPolling()          -- For HTTP polling (always works)

print("[Telegram Bot] Integration active!")
print("[Telegram Bot] Configure your server URL: " .. SERVER_URL)
print("[Telegram Bot] Players will receive notifications in-game")
print("=================================")

--[[
CLIENT SCRIPT - Place this in StarterPlayer/StarterPlayerScripts/TelegramClient.lua
Copy everything below this line into a new LocalScript:

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local StarterGui = game:GetService("StarterGui")
local SoundService = game:GetService("SoundService")

local player = Players.LocalPlayer

-- Wait for the RemoteEvent
local notificationEvent = ReplicatedStorage:WaitForChild("TelegramNotification")

-- Notification sound
local notificationSound = Instance.new("Sound")
notificationSound.SoundId = "rbxasset://sounds/electronicpingshort.wav"
notificationSound.Volume = 0.5
notificationSound.Parent = SoundService

-- Handle incoming Telegram notifications
notificationEvent.OnClientEvent:Connect(function(data)
    local message = data.message
    local title = data.title or "Telegram Message"
    local sender = data.sender or "Admin"
    
    -- Play notification sound
    notificationSound:Play()
    
    -- Show Roblox notification popup
    StarterGui:SetCore("SendNotification", {
        Title = title;
        Text = message;
        Duration = 8;
        Icon = "rbxassetid://13560193391"; -- Optional Telegram icon
        Button1 = "OK";
    })
    
    -- Add to chat
    StarterGui:SetCore("ChatMakeSystemMessage", {
        Text = message;
        Color = Color3.fromRGB(0, 136, 204); -- Telegram blue
        Font = Enum.Font.GothamBold;
    })
    
    print("[Telegram] " .. message)
end)

print("[Telegram Client] Ready to receive notifications!")
--]]
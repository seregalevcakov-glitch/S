import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { CodeTabs } from "@/components/code-tabs";
import { StatusCard } from "@/components/status-card";
import { MessageLog } from "@/components/message-log";
import { QuickSetup } from "@/components/quick-setup";
import { DemoDataButton } from "@/components/demo-data-button";
import { NotificationStatus } from "@/components/notification-status";
import { RobloxInstructions } from "@/components/roblox-instructions";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const [telegramToken, setTelegramToken] = useState("");
  const [newUserId, setNewUserId] = useState("");
  const [universeId, setUniverseId] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [showQuickSetup, setShowQuickSetup] = useState(true);

  // Fetch system status
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ["/api/status"],
  });

  // Fetch Telegram config
  const { data: telegramConfig, refetch: refetchTelegramConfig } = useQuery({
    queryKey: ["/api/telegram/config"],
  });

  // Fetch authorized users
  const { data: authorizedUsers = [], refetch: refetchUsers } = useQuery({
    queryKey: ["/api/telegram/users"],
  });

  // Fetch Roblox config
  const { data: robloxConfig, refetch: refetchRobloxConfig } = useQuery({
    queryKey: ["/api/roblox/config"],
  });

  // Fetch recent logs
  const { data: recentLogs = [] } = useQuery({
    queryKey: ["/api/logs"],
  });

  const handleSaveTelegramToken = async () => {
    if (!telegramToken.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid bot token",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/telegram/config", {
        botToken: telegramToken,
        isActive: true,
      });
      
      toast({
        title: "Success",
        description: "Telegram bot token saved and bot started",
      });
      
      setTelegramToken("");
      refetchTelegramConfig();
      refetchStatus();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save Telegram bot token",
        variant: "destructive",
      });
    }
  };

  const handleAddUser = async () => {
    if (!newUserId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Telegram User ID",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/telegram/users", {
        telegramUserId: newUserId,
        isActive: true,
      });
      
      toast({
        title: "Success",
        description: "Authorized user added successfully",
      });
      
      setNewUserId("");
      refetchUsers();
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to add authorized user",
        variant: "destructive",
      });
    }
  };

  const handleRemoveUser = async (telegramUserId: string) => {
    try {
      await apiRequest("DELETE", `/api/telegram/users/${telegramUserId}`, null);
      
      toast({
        title: "Success",
        description: "User removed successfully",
      });
      
      refetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove user", 
        variant: "destructive",
      });
    }
  };

  const handleSaveRobloxConfig = async () => {
    try {
      await apiRequest("POST", "/api/roblox/config", {
        universeId: universeId || null,
        placeId: placeId || null,
        isActive: true,
      });
      
      toast({
        title: "Success",
        description: "Roblox configuration saved",
      });
      
      refetchRobloxConfig();
      refetchStatus();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save Roblox configuration",
        variant: "destructive",
      });
    }
  };

  const handleTestBot = async () => {
    try {
      const response = await apiRequest("POST", "/api/telegram/test", {});
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Bot is working! Connected as: ${result.botInfo.first_name}`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Bot test failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test bot connection",
        variant: "destructive",
      });
    }
  };

  // Check if system needs initial setup
  const needsSetup = !telegramConfig || !(telegramConfig as any)?.botToken || 
                    (authorizedUsers as any[]).length === 0;

  const handleSetupComplete = () => {
    setShowQuickSetup(false);
    refetchTelegramConfig();
    refetchUsers();
    refetchRobloxConfig();
    refetchStatus();
  };

  if (statusLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Show quick setup if needed and user hasn't dismissed it
  if (needsSetup && showQuickSetup) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Добро пожаловать в Roblox Telegram Bot!
          </h1>
          <p className="text-gray-400 text-lg">
            Давайте быстро настроим ваш бот для отправки сообщений в игру
          </p>
        </div>
        
        <QuickSetup onComplete={handleSetupComplete} />
        
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowQuickSetup(false)}
            className="text-gray-400 hover:text-white text-sm underline"
            data-testid="button-skip-setup"
          >
            Пропустить и настроить вручную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Setup Section */}
          <Card className="bg-secondary border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold text-white">Настройка системы</CardTitle>
                <div className="flex items-center space-x-2">
                  {!(telegramConfig as any)?.botToken && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      Требуется настройка
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQuickSetup(true)}
                    data-testid="button-quick-setup"
                  >
                    Быстрая настройка
                  </Button>
                  <DemoDataButton onComplete={handleSetupComplete} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Telegram Bot Token */}
              <div className="flex items-start space-x-4 p-4 bg-gray-800 rounded-lg border border-gray-600">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2">Configure Telegram Bot Token</h3>
                  <p className="text-gray-400 text-sm mb-3">Enter your bot token from @BotFather</p>
                  <div className="flex space-x-2">
                    <Input
                      type="password"
                      placeholder="1234567890:ABCdefGHIjklMNOpqrSTUvwxyz"
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                      className="flex-1 bg-gray-900 border-gray-600 text-white placeholder-gray-500"
                      data-testid="input-telegram-token"
                    />
                    <Button 
                      onClick={handleSaveTelegramToken}
                      className="bg-primary hover:bg-indigo-600"
                      data-testid="button-save-telegram-token"
                    >
                      Save
                    </Button>
                  </div>
                  {(telegramConfig as any)?.botToken && (
                    <div className="mt-3 flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span className="text-emerald-400 text-sm">Token configured</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTestBot}
                        className="ml-2"
                        data-testid="button-test-bot"
                      >
                        Test Connection
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Authorized Users */}
              <div className="flex items-start space-x-4 p-4 bg-gray-800 rounded-lg border border-gray-600">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2">Add Authorized Users</h3>
                  <p className="text-gray-400 text-sm mb-3">Only these Telegram User IDs can send notifications</p>
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="123456789"
                      value={newUserId}
                      onChange={(e) => setNewUserId(e.target.value)}
                      className="flex-1 bg-gray-900 border-gray-600 text-white placeholder-gray-500"
                      data-testid="input-user-id"
                    />
                    <Button
                      variant="outline"
                      onClick={handleAddUser}
                      data-testid="button-add-user"
                    >
                      Add User
                    </Button>
                  </div>
                  {(authorizedUsers as any[]).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(authorizedUsers as any[]).map((user: any) => (
                        <Badge
                          key={user.telegramUserId}
                          variant="secondary"
                          className="bg-emerald-900 text-emerald-300 flex items-center space-x-2"
                        >
                          <span>{user.telegramUserId}</span>
                          <button
                            onClick={() => handleRemoveUser(user.telegramUserId)}
                            className="hover:text-emerald-100 ml-2"
                            data-testid={`button-remove-user-${user.telegramUserId}`}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Roblox Configuration */}
              <div className="flex items-start space-x-4 p-4 bg-gray-800 rounded-lg border border-gray-600">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2">Roblox Game Configuration</h3>
                  <p className="text-gray-400 text-sm mb-3">Configure your Roblox game settings</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <Input
                      type="text"
                      placeholder="Universe ID"
                      value={universeId}
                      onChange={(e) => setUniverseId(e.target.value)}
                      className="bg-gray-900 border-gray-600 text-white placeholder-gray-500"
                      data-testid="input-universe-id"
                    />
                    <Input
                      type="text"
                      placeholder="Place ID"
                      value={placeId}
                      onChange={(e) => setPlaceId(e.target.value)}
                      className="bg-gray-900 border-gray-600 text-white placeholder-gray-500"
                      data-testid="input-place-id"
                    />
                  </div>
                  <Button
                    onClick={handleSaveRobloxConfig}
                    className="bg-primary hover:bg-indigo-600"
                    data-testid="button-save-roblox-config"
                  >
                    Save Configuration
                  </Button>
                  {(robloxConfig as any) && (
                    <div className="mt-3 flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span className="text-emerald-400 text-sm">Configuration saved</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roblox Integration Instructions */}
          <RobloxInstructions />

          {/* Recent Messages */}
          <MessageLog logs={recentLogs as any} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <NotificationStatus />

          {/* Quick Commands */}
          <Card className="bg-secondary border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Quick Commands</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleTestBot}
                className="w-full bg-primary hover:bg-indigo-600 text-white justify-start"
                data-testid="button-test-connection"
              >
                Test Bot Connection
              </Button>
              <Button
                onClick={() => refetchStatus()}
                variant="secondary"
                className="w-full justify-start"
                data-testid="button-refresh-status"
              >
                Refresh Status
              </Button>
              <Button
                onClick={() => window.open("/logs", "_blank")}
                variant="secondary"
                className="w-full justify-start"
                data-testid="button-view-logs"
              >
                View Full Logs
              </Button>
            </CardContent>
          </Card>

          {/* Documentation Links */}
          <Card className="bg-secondary border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a href="#setup-guide" className="block text-primary hover:text-indigo-400 font-medium">
                📖 Setup Guide
              </a>
              <a href="https://core.telegram.org/bots/api" className="block text-primary hover:text-indigo-400 font-medium" target="_blank" rel="noopener noreferrer">
                🤖 Telegram Bot API
              </a>
              <a href="https://create.roblox.com/docs/reference/engine/classes/HttpService" className="block text-primary hover:text-indigo-400 font-medium" target="_blank" rel="noopener noreferrer">
                🎮 Roblox HTTP Service
              </a>
              <a href="#troubleshooting" className="block text-primary hover:text-indigo-400 font-medium">
                🐛 Troubleshooting
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

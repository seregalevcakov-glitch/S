import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Database } from "lucide-react";

interface DemoDataButtonProps {
  onComplete: () => void;
}

export function DemoDataButton({ onComplete }: DemoDataButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const addDemoData = async () => {
    setIsLoading(true);
    
    try {
      // 1. Добавить демо Telegram конфиг
      await apiRequest("POST", "/api/telegram/config", {
        botToken: "123456789:ABCdefGHIjklMNOpqrSTUvwxyz-DEMO-TOKEN",
        isActive: true,
      });

      // 2. Добавить демо пользователей
      const demoUsers = [
        { telegramUserId: "123456789", username: "demo_user_1", isActive: true },
        { telegramUserId: "987654321", username: "demo_user_2", isActive: true },
        { telegramUserId: "555666777", username: "game_admin", isActive: true },
      ];
      
      for (const user of demoUsers) {
        await apiRequest("POST", "/api/telegram/users", user);
      }

      // 3. Добавить демо Roblox конфиг
      await apiRequest("POST", "/api/roblox/config", {
        universeId: "1234567890",
        placeId: "9876543210",
        webhookUrl: "https://example-game.com/webhook",
        apiKey: "rbx_cloud_demo_key_12345",
        isActive: true,
      });

      // 4. Добавить демо логи сообщений напрямую в хранилище
      const demoMessages = [
        {
          telegramUserId: "123456789",
          message: "Привет всем игрокам! Добро пожаловать на сервер!",
          status: "success",
        },
        {
          telegramUserId: "987654321", 
          message: "Внимание! Скоро начнется событие!",
          status: "success",
        },
        {
          telegramUserId: "555666777",
          message: "Сервер будет перезагружен через 5 минут",
          status: "success",
        },
        {
          telegramUserId: "123456789",
          message: "Тестовое сообщение с ошибкой",
          status: "error",
          errorMessage: "Connection timeout to Roblox server",
        },
        {
          telegramUserId: "987654321",
          message: "Удачной игры всем!",
          status: "success",
        },
      ];

      for (const msg of demoMessages) {
        await apiRequest("POST", "/api/logs", {
          telegramUserId: msg.telegramUserId,
          message: msg.message,
          status: msg.status,
          errorMessage: msg.errorMessage || null,
        });
      }

      toast({
        title: "Демо данные добавлены!",
        description: "Система заполнена примерами для демонстрации функций",
      });

      onComplete();
      
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить демо данные",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={addDemoData}
      disabled={isLoading}
      variant="outline"
      className="bg-green-900 border-green-600 text-green-100 hover:bg-green-800"
      data-testid="button-add-demo-data"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Добавляю данные...
        </>
      ) : (
        <>
          <Database className="h-4 w-4 mr-2" />
          Добавить демо данные
        </>
      )}
    </Button>
  );
}
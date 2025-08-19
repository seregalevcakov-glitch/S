import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface QuickSetupProps {
  onComplete: () => void;
}

export function QuickSetup({ onComplete }: QuickSetupProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form data
  const [formData, setFormData] = useState({
    // Telegram settings
    telegramBotToken: "",
    authorizedUserIds: "",
    
    // Roblox settings
    universeId: "",
    placeId: "",
    apiKey: "",
  });

  const steps = [
    {
      title: "Telegram Bot Token",
      description: "Получите токен от @BotFather в Telegram",
      field: "telegramBotToken",
      placeholder: "1234567890:ABCdefGHIjklMNOpqrSTUvwxyz",
      type: "password" as const,
    },
    {
      title: "Разрешенные пользователи",
      description: "ID пользователей Telegram через запятую",
      field: "authorizedUserIds",
      placeholder: "123456789, 987654321",
      type: "text" as const,
    },
    {
      title: "Universe ID",
      description: "ID вселенной вашей игры Roblox",
      field: "universeId", 
      placeholder: "1234567890",
      type: "text" as const,
    },
    {
      title: "Place ID",
      description: "ID места вашей игры Roblox",
      field: "placeId",
      placeholder: "9876543210",
      type: "text" as const,
    },
    {
      title: "Roblox API Key (необязательно)",
      description: "Open Cloud API ключ для MessagingService",
      field: "apiKey",
      placeholder: "rbx_cloud_...",
      type: "password" as const,
    },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    const currentField = steps[currentStep].field;
    const currentValue = formData[currentField as keyof typeof formData];
    
    // Валидация обязательных полей
    if (currentStep < 4 && !currentValue.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните это поле",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    
    try {
      // 1. Настройка Telegram бота
      await apiRequest("POST", "/api/telegram/config", {
        botToken: formData.telegramBotToken,
        isActive: true,
      });

      // 2. Добавление разрешенных пользователей
      const userIds = formData.authorizedUserIds
        .split(',')
        .map(id => id.trim())
        .filter(id => id);
        
      for (const userId of userIds) {
        await apiRequest("POST", "/api/telegram/users", {
          telegramUserId: userId,
          isActive: true,
        });
      }

      // 3. Настройка Roblox
      await apiRequest("POST", "/api/roblox/config", {
        universeId: formData.universeId || null,
        placeId: formData.placeId || null,
        apiKey: formData.apiKey || null,
        isActive: true,
      });

      toast({
        title: "Успешно!",
        description: "Все настройки сохранены. Telegram бот запущен!",
      });

      onComplete();
      
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Card className="bg-secondary border-gray-700 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white text-center">
          Быстрая настройка Telegram бота
        </CardTitle>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-center text-sm text-gray-400 mt-2">
          Шаг {currentStep + 1} из {steps.length}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            {currentStepData.title}
          </h3>
          <p className="text-gray-400 text-sm">
            {currentStepData.description}
          </p>
        </div>

        <div className="space-y-4">
          <Label htmlFor="current-input" className="text-white">
            {currentStepData.title}
          </Label>
          <Input
            id="current-input"
            type={currentStepData.type}
            placeholder={currentStepData.placeholder}
            value={formData[currentStepData.field as keyof typeof formData]}
            onChange={(e) => handleInputChange(currentStepData.field, e.target.value)}
            className="bg-gray-900 border-gray-600 text-white placeholder-gray-500"
            data-testid={`input-${currentStepData.field}`}
            autoFocus
          />
        </div>

        {/* Подсказки для текущего шага */}
        {currentStep === 0 && (
          <Alert className="bg-blue-900 border-blue-600">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-blue-100">
              Создайте бота у @BotFather в Telegram и скопируйте токен сюда
            </AlertDescription>
          </Alert>
        )}
        
        {currentStep === 1 && (
          <Alert className="bg-green-900 border-green-600">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-100">
              Узнайте свой Telegram ID у @userinfobot и добавьте его здесь
            </AlertDescription>
          </Alert>
        )}

        {currentStep >= 2 && (
          <Alert className="bg-purple-900 border-purple-600">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-purple-100">
              Найдите ID своей игры в Roblox Studio или на странице игры
            </AlertDescription>
          </Alert>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isLoading}
            data-testid="button-back"
          >
            Назад
          </Button>

          <Button
            onClick={handleNext}
            disabled={isLoading}
            className="bg-primary hover:bg-indigo-600 min-w-32"
            data-testid="button-next"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Сохраняю...
              </>
            ) : currentStep === steps.length - 1 ? (
              "Завершить настройку"
            ) : (
              "Далее"
            )}
          </Button>
        </div>

        {/* Skip option for optional fields */}
        {currentStep === steps.length - 1 && (
          <div className="text-center">
            <button
              onClick={handleComplete}
              className="text-gray-400 hover:text-white text-sm underline"
              disabled={isLoading}
              data-testid="button-skip-api-key"
            >
              Пропустить API ключ (можно добавить позже)
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
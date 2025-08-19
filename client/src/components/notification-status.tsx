import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Wifi, WifiOff } from "lucide-react";

export function NotificationStatus() {
  const { data: systemStatus, isLoading } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: logs } = useQuery({
    queryKey: ['/api/logs'],
    refetchInterval: 3000, // Refresh logs every 3 seconds
  });

  if (isLoading) {
    return (
      <Card className="bg-secondary border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Статус системы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-400">Загрузка...</div>
        </CardContent>
      </Card>
    );
  }

  const telegramStatus = (systemStatus as any)?.systemStatus?.find((s: any) => s.component === 'telegram_bot');
  const robloxStatus = (systemStatus as any)?.systemStatus?.find((s: any) => s.component === 'roblox_connection');
  
  const recentLogs = (logs as any[])?.slice(0, 3) || [];
  const lastMessage = recentLogs[0];
  const lastMessageTime = lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString() : null;

  return (
    <Card className="bg-secondary border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Статус системы
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Telegram Bot</span>
            <Badge 
              variant={telegramStatus?.status === 'online' ? 'default' : 'destructive'}
              className={telegramStatus?.status === 'online' ? 'bg-green-600' : ''}
            >
              {telegramStatus?.status === 'online' ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Онлайн
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Офлайн
                </>
              )}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-300">Roblox подключение</span>
            <Badge 
              variant={robloxStatus?.status === 'online' ? 'default' : 'secondary'}
              className={robloxStatus?.status === 'online' ? 'bg-green-600' : 'bg-yellow-600'}
            >
              {robloxStatus?.status === 'online' ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  Активно
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Ожидание
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Statistics */}
        <div className="pt-2 border-t border-gray-600">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Сообщений</div>
              <div className="text-white font-semibold">
                {(systemStatus as any)?.stats?.totalMessages || 0}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Успешность</div>
              <div className="text-white font-semibold">
                {(systemStatus as any)?.stats?.successRate || 0}%
              </div>
            </div>
          </div>
        </div>

        {/* Last Message Status */}
        {lastMessage && (
          <div className="pt-2 border-t border-gray-600">
            <div className="flex items-center gap-2 text-sm">
              {lastMessage.status === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : lastMessage.status === 'error' ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <Clock className="h-4 w-4 text-yellow-500" />
              )}
              
              <div className="flex-1">
                <div className="text-gray-300">
                  Последнее сообщение {lastMessageTime}
                </div>
                <div className="text-gray-400 text-xs truncate">
                  {lastMessage.message.length > 40 
                    ? lastMessage.message.substring(0, 40) + '...'
                    : lastMessage.message
                  }
                </div>
                {lastMessage.errorMessage && (
                  <div className="text-red-400 text-xs">
                    Ошибка: {lastMessage.errorMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Connection Instructions */}
        {robloxStatus?.status !== 'online' && (
          <div className="pt-2 border-t border-gray-600">
            <div className="text-xs text-yellow-400 bg-yellow-900/20 p-2 rounded">
              💡 Для получения сообщений в Roblox включите "Allow HTTP Requests" в настройках игры и добавьте скрипт
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
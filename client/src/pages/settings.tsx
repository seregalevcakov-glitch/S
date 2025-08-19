import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-2">Configure your Telegram bot and Roblox integration</p>
        </div>

        {/* Telegram Settings */}
        <Card className="bg-secondary border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">Telegram Bot Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bot-token" className="text-white">Bot Token</Label>
              <Input
                id="bot-token"
                type="password"
                placeholder="Enter your bot token"
                className="bg-gray-900 border-gray-600 text-white"
                data-testid="input-settings-bot-token"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-white">Enable Bot</Label>
                <p className="text-sm text-gray-400">Start/stop the Telegram bot</p>
              </div>
              <Switch data-testid="switch-enable-bot" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcome-message" className="text-white">Welcome Message</Label>
              <Textarea
                id="welcome-message"
                placeholder="Customize the welcome message sent to new users"
                className="bg-gray-900 border-gray-600 text-white"
                data-testid="textarea-welcome-message"
              />
            </div>
          </CardContent>
        </Card>

        {/* Roblox Settings */}
        <Card className="bg-secondary border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">Roblox Game Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="universe-id" className="text-white">Universe ID</Label>
                <Input
                  id="universe-id"
                  placeholder="Your game's universe ID"
                  className="bg-gray-900 border-gray-600 text-white"
                  data-testid="input-settings-universe-id"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="place-id" className="text-white">Place ID</Label>
                <Input
                  id="place-id"
                  placeholder="Your game's place ID"
                  className="bg-gray-900 border-gray-600 text-white"
                  data-testid="input-settings-place-id"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-url" className="text-white">Webhook URL</Label>
              <Input
                id="webhook-url"
                placeholder="https://your-game.com/webhook"
                className="bg-gray-900 border-gray-600 text-white"
                data-testid="input-settings-webhook-url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key" className="text-white">API Key (Optional)</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Roblox Open Cloud API key"
                className="bg-gray-900 border-gray-600 text-white"
                data-testid="input-settings-api-key"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-secondary border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">Security Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-white">Rate Limiting</Label>
                <p className="text-sm text-gray-400">Limit the number of messages per user per minute</p>
              </div>
              <Switch defaultChecked data-testid="switch-rate-limiting" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate-limit" className="text-white">Messages per minute</Label>
              <Input
                id="rate-limit"
                type="number"
                defaultValue="5"
                className="bg-gray-900 border-gray-600 text-white"
                data-testid="input-rate-limit"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-white">Message Logging</Label>
                <p className="text-sm text-gray-400">Keep logs of all sent messages</p>
              </div>
              <Switch defaultChecked data-testid="switch-message-logging" />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            data-testid="button-reset-settings"
          >
            Reset to Defaults
          </Button>
          <Button
            className="bg-primary hover:bg-indigo-600"
            data-testid="button-save-settings"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

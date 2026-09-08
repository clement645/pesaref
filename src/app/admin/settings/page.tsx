import { AlertTriangle } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/session';
import { getAllSettings } from '@/lib/services/settings.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SettingsForm } from './settings-form';

export const metadata = { title: 'Platform Settings - PesaRef Admin' };

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  const settings = await getAllSettings();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Platform settings</h1>

      {admin.role !== 'SUPER_ADMIN' ? (
        <>
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Read-only</AlertTitle>
            <AlertDescription>
              Financial configuration changes are restricted to SUPER_ADMIN accounts. You can view the
              current settings below.
            </AlertDescription>
          </Alert>
          <Card>
            <CardContent className="grid gap-3 pt-6 text-sm sm:grid-cols-2">
              {Object.entries(settings).map(([key, value]) => (
                <div key={key}>
                  <p className="text-muted-foreground">{key}</p>
                  <p className="font-medium">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Business configuration</CardTitle>
            <CardDescription>These values control the registration fee, referral commission, and withdrawal rules platform-wide.</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm settings={settings} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { requireUser } from '@/lib/auth/session';
import { formatPhoneForDisplay } from '@/lib/utils/phone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from './profile-form';

export const metadata = { title: 'Profile - PesaRef' };

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
          <CardDescription>Email: {user.email} - Referral code: {user.referralCode}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm fullName={user.fullName} phone={formatPhoneForDisplay(user.phone)} />
        </CardContent>
      </Card>
    </div>
  );
}

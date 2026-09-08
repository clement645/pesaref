export const metadata = { title: 'About - PesaRef' };

export default function AboutPage() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="text-3xl font-bold">About PesaRef</h1>
      <div className="prose prose-neutral mt-6 max-w-none text-muted-foreground">
        <p>
          PesaRef is a referral management platform built for Kenyan members who want a transparent,
          well-documented way to track referrals, commissions, and withdrawals. Every member pays a
          one-time registration/service fee to activate their account and gain access to the
          platform&apos;s referral tools.
        </p>
        <p>
          When an activated member refers a new person who also completes and has their registration
          payment verified, the referring member earns a fixed one-level referral commission. There
          are no multi-level payouts and no guaranteed-income claims - commissions depend entirely on
          successfully referring real, verified members.
        </p>
        <p>
          All registration and withdrawal payments are currently processed manually by our
          administration team via M-Pesa, with every approval, rejection, and adjustment recorded in
          an immutable audit log.
        </p>
      </div>
    </div>
  );
}

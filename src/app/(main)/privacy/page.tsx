export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">1. Information We Collect</h2>
        <p>We collect information you provide directly to us, such as when you create or modify your account, use our services, or communicate with us. This may include your name, email address, username, password, profile picture, and any other information you choose to provide.</p>
        
        <h2 className="text-xl font-semibold">2. How We Use Information</h2>
        <p>We use the information we collect to provide, maintain, and improve our services, to develop new ones, and to protect WakkaWakka and our users.</p>
        
        <h2 className="text-xl font-semibold">3. Information Sharing</h2>
        <p>We do not share your personal information with companies, organizations, or individuals outside of WakkaWakka except in the following cases: with your consent, for legal reasons, or for external processing.</p>
        
        <h2 className="text-xl font-semibold">4. Data Security</h2>
        <p>We work hard to protect WakkaWakka and our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold.</p>
      </section>
    </div>
  );
}

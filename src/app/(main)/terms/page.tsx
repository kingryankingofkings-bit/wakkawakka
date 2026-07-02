export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-6">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
        <p>By accessing or using WakkaWakka, you agree to be bound by these Terms of Service.</p>
        
        <h2 className="text-xl font-semibold">2. User Conduct</h2>
        <p>You agree not to use the service for any unlawful purpose or in any way that interrupts, damages, or impairs the service.</p>
        
        <h2 className="text-xl font-semibold">3. Content Guidelines</h2>
        <p>You retain your rights to any content you submit, post or display on or through the Services. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display and distribute such content.</p>
        
        <h2 className="text-xl font-semibold">4. Termination</h2>
        <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
      </section>
    </div>
  );
}

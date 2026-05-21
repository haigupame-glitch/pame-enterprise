import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-700/50 p-8">
        <Link to="/" className="inline-flex items-center text-sm text-brand-400 hover:text-brand-300 mb-6 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to App
        </Link>
        <h1 className="text-3xl font-black text-white tracking-tight mb-8">Privacy Policy</h1>
        
        <div className="space-y-6 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when you create an account, update your profile, or interact with the application. This may include your name, contact information, role, and other relevant details required for authentication and group management.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to operate, maintain, and provide the features of the application. This includes authenticating your access, managing your group roles, and synchronizing state across your authorized devices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Data Security and Privacy</h2>
            <p>
              Your data is stored securely using cloud infrastructure (e.g., Firebase). We take reasonable measures to help protect your information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Sharing of Information</h2>
            <p>
              We do not share your personal information with third parties except as necessary to provide the service (such as using our backend providers) or when required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Your Choices and Rights</h2>
            <p>
              You have the right to request the deletion of your account and associated personal data at any time through the application settings. Upon deletion, your data will be permanently removed from our active databases.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or our data practices, please contact the application administrators.
            </p>
          </section>

          <p className="text-xs text-slate-500 pt-8 border-t border-slate-700/50">
            Last Updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-700/50 p-8">
        <Link to="/" className="inline-flex items-center text-sm text-brand-400 hover:text-brand-300 mb-6 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to App
        </Link>
        <h1 className="text-3xl font-black text-white tracking-tight mb-8">Terms of Service</h1>
        
        <div className="space-y-6 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Description of Service</h2>
            <p>
              This application provides state synchronization, group management, and administrative tools for registered members. The service is provided "as is" and "as available". We reserve the right to modify, suspend, or discontinue the service at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. User Accounts</h2>
            <p>
              To use certain features of the service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to keep your account information updated. You are responsible for safeguarding your password and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Appropriate Use</h2>
            <p>
              You agree to use this application only for lawful purposes. You must not use the application in any way that causes, or may cause, damage to the application or impairment of the availability or accessibility of the application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Disclaimer of Warranties</h2>
            <p>
              The application administrators and developers make no warranty that the service will meet your requirements, or that the service will be uninterrupted, timely, secure, or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Limitation of Liability</h2>
            <p>
              In no event shall the providers of this application be liable for any direct, indirect, incidental, special, consequential, or exemplary damages arising out of or in connection with your use or inability to use the service.
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

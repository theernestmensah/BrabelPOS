import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="bg-obsidian min-h-screen flex items-center justify-center relative">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-neon-cyan/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Logo header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-cyan-dim flex items-center justify-center glow-cyan">
            <svg className="w-5 h-5 text-obsidian" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-1.45-5c.75 0 1.41-.41 1.75-1.03L21 5H5.21l-.94-2H1v2h2l3.6 7.59L5.25 14c-.16.28-.25.61-.25.96C5 16.1 5.9 17 7 17h14v-2H7.42c-.13 0-.25-.11-.25-.25l.03-.12.9-1.63H17.55z"/>
            </svg>
          </div>
          <div>
            <div className="font-black text-xl leading-tight">
              <span className="gradient-text-cyan">BrAbel</span>
              <span className="text-white/70">POS</span>
            </div>
            <div className="text-[10px] text-white/30 tracking-widest uppercase">Ghana · GHS</div>
          </div>
        </div>

        <SignUp
          appearance={{
            variables: {
              colorPrimary: "#00F0FF",
              colorBackground: "#0f0f12",
              colorText: "#f8f8f8",
              colorTextSecondary: "#9999aa",
              colorInputBackground: "#1a1a20",
              colorInputText: "#f8f8f8",
              borderRadius: "0.75rem",
              fontFamily: "Inter, system-ui, sans-serif",
            },
            elements: {
              card: "bg-obsidian-100 border border-white/8 shadow-2xl",
              headerTitle: "text-white font-black",
              headerSubtitle: "text-white/50",
              socialButtonsBlockButton:
                "bg-white/5 border border-white/10 text-white hover:bg-white/10",
              dividerLine: "bg-white/10",
              dividerText: "text-white/30",
              formFieldLabel: "text-white/60",
              formFieldInput:
                "bg-obsidian-200 border-white/10 text-white focus:border-neon-cyan/50",
              footerActionLink: "text-neon-cyan hover:text-neon-cyan-dim",
              formButtonPrimary:
                "bg-gradient-to-r from-neon-cyan to-neon-cyan-dim text-obsidian font-bold hover:opacity-90",
            },
          }}
        />
      </div>
    </main>
  );
}

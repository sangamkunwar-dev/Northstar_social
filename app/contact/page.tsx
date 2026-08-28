import Link from 'next/link'

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="text-lg font-semibold">नर्थस्टार सामाजिक</Link>
        <Link href="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">Back home</Link>
      </header>
      <section className="mx-auto max-w-2xl py-24">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Contact</p>
        <h1 className="mt-5 text-5xl font-semibold tracking-tight text-balance">Let&apos;s build a better content rhythm.</h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">Have a question, idea, or feedback about नर्थस्टार सामाजिक? I&apos;d love to hear from you.</p>
        <a href="mailto:sangamkunwar@example.com" className="mt-9 inline-flex rounded-xl bg-primary px-5 py-4 text-sm font-bold text-primary-foreground">Email Sangam</a>
        <p className="mt-10 text-xs text-muted-foreground">Made by Sangam Kunwar</p>
      </section>
    </main>
  )
}

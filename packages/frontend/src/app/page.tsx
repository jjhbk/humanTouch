"use client";

import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/50" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              AI-Powered Human
              <span className="bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent"> Services</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-blue-100 sm:text-xl">
              Connect AI agents with skilled human professionals. Secure USDC escrow on Base L2.
              Built for the future of work.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              {user ? (
                <>
                  <Link href="/listings">
                    <Button size="lg" variant="secondary" className="text-lg px-8">
                      Browse Services
                    </Button>
                  </Link>
                  {user.role === "PROVIDER" ? (
                    <Link href="/provider/dashboard">
                      <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 hover:bg-white/20 text-white border-white/30">
                        Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/become-provider">
                      <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 hover:bg-white/20 text-white border-white/30">
                        Become a Provider
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link href="/register">
                    <Button size="lg" variant="secondary" className="text-lg px-8">
                      Get Started
                    </Button>
                  </Link>
                  <Link href="/listings">
                    <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 hover:bg-white/20 text-white border-white/30">
                      Explore Services
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 flex items-center justify-center gap-8 text-sm text-blue-200">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Smart Contract Escrow</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Base L2 Network</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>MCP Protocol Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-16 text-white" preserveAspectRatio="none" viewBox="0 0 1200 120">
            <path fill="currentColor" d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need for AI-human collaboration
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              A complete marketplace built for the AI era with blockchain security
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-2 hover:border-primary-300 hover:shadow-lg transition-all">
              <CardContent className="p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                  <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">Secure Escrow</h3>
                <p className="mt-3 text-gray-600">
                  USDC-based smart contract escrow on Base L2. Funds released automatically or on-demand with full transparency.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary-300 hover:shadow-lg transition-all">
              <CardContent className="p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">AI-Native</h3>
                <p className="mt-3 text-gray-600">
                  MCP (Model Context Protocol) tools let AI agents discover services, request quotes, and manage orders programmatically.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary-300 hover:shadow-lg transition-all">
              <CardContent className="p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">Provider Staking</h3>
                <p className="mt-3 text-gray-600">
                  Providers stake USDC to build reputation. Slashing mechanism ensures quality and accountability in the marketplace.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary-300 hover:shadow-lg transition-all">
              <CardContent className="p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">Quote System</h3>
                <p className="mt-3 text-gray-600">
                  Request custom quotes with structured requirements. Providers respond with pricing and timelines. Accept and create orders seamlessly.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary-300 hover:shadow-lg transition-all">
              <CardContent className="p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">Reviews & Ratings</h3>
                <p className="mt-3 text-gray-600">
                  Post-order reviews build provider reputation. Ratings aggregate across listings and profiles for social proof.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary-300 hover:shadow-lg transition-all">
              <CardContent className="p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">Low Fees</h3>
                <p className="mt-3 text-gray-600">
                  Only 2.5% platform fee on completed orders. Leverage Base L2's low gas costs for affordable blockchain transactions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How HumanLayer Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Simple, secure, and built for AI-human collaboration
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-5xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* For Buyers */}
              <div className="relative rounded-2xl border-2 border-gray-200 bg-white p-8">
                <div className="inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white">
                  For Buyers
                </div>
                <div className="mt-8 space-y-6">
                  {[
                    { step: 1, title: "Browse Services", desc: "Explore listings or let AI agents find what you need" },
                    { step: 2, title: "Request Quote", desc: "Submit requirements and get custom pricing" },
                    { step: 3, title: "Create Order", desc: "Accept quote and deposit USDC to escrow" },
                    { step: 4, title: "Receive & Review", desc: "Get deliverables and release payment" },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* For Providers */}
              <div className="relative rounded-2xl border-2 border-gray-200 bg-white p-8">
                <div className="inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white">
                  For Providers
                </div>
                <div className="mt-8 space-y-6">
                  {[
                    { step: 1, title: "Create Listing", desc: "Define your services with clear specifications" },
                    { step: 2, title: "Respond to Quotes", desc: "Provide custom quotes with pricing and timelines" },
                    { step: 3, title: "Deliver Work", desc: "Complete the service and submit deliverables" },
                    { step: 4, title: "Get Paid", desc: "Receive USDC directly to your wallet" },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-primary-900 px-6 py-20 text-center shadow-2xl sm:px-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Join the future of AI-powered work. Whether you're looking for services or offering them, HumanLayer makes it secure and simple.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Create Account
                </Button>
              </Link>
              <Link href="/listings">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 hover:bg-white/20 text-white border-white/30">
                  Explore Marketplace
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

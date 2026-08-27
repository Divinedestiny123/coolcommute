'use client';

import Link from 'next/link';
import { ArrowRight, Thermometer, Map, BarChart3, ShieldCheck, Sun } from 'lucide-react';
import './page.module.css'; // Optional if we need page-specific CSS

export default function Home() {
  return (
    <div className="container">
      {/* Navigation */}
      <nav className="navbar animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sun size={28} color="var(--accent-primary)" />
          <span style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>CoolCommute</span>
        </div>
        <div className="nav-buttons">
          <Link href="/app" className="btn btn-secondary">
            Open App
          </Link>
          <Link href="/dashboard" className="btn btn-primary">
            City Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: '6rem 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
        <div className="animate-fade-in" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 'var(--border-radius-pill)', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', fontWeight: 500 }}>
          <Thermometer size={16} /> Powered by FortyGuard Temperature API
        </div>
        
        <h1 className="heading-1 animate-fade-in delay-100" style={{ maxWidth: '800px', margin: '0 auto' }}>
          Navigate the Urban Heat Island <br/>
          <span className="text-gradient">With Intelligence.</span>
        </h1>
        
        <p className="animate-fade-in delay-200" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
          Discover the coolest routes for your commute, workout, or walk. 
          Protect yourself and build climate-resilient cities with real-time temperature data.
        </p>

        <div className="animate-fade-in delay-300" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Link href="/app" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
            Plan Your Route <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '4rem 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          <div className="glass-card animate-fade-in delay-100" style={{ padding: '2rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', marginBottom: '1.5rem' }}>
              <Map size={24} />
            </div>
            <h3 className="heading-2" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Smart Heat Routing</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Our routing engine calculates paths that minimize exposure to extreme heat, keeping pedestrians and cyclists safe.
            </p>
          </div>

          <div className="glass-card animate-fade-in delay-200" style={{ padding: '2rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-secondary)', marginBottom: '1.5rem' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 className="heading-2" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Hyperlocal Accuracy</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Leveraging data measured 2 meters above ground at 10m² resolution, ensuring the temperature you see is what you feel.
            </p>
          </div>

          <div className="glass-card animate-fade-in delay-300" style={{ padding: '2rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-success)', marginBottom: '1.5rem' }}>
              <BarChart3 size={24} />
            </div>
            <h3 className="heading-2" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>City Planner Insights</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              A powerful B2B dashboard for municipalities to track heat stress zones and plan tree planting or cooling infrastructure.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--glass-border)', padding: '2rem 0', marginTop: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>Built for the Hackathon'26: Building the World's Temperature AI</p>
      </footer>
    </div>
  );
}

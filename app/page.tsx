import Image from 'next/image';
import { Visualizer } from '@/components/Visualizer';

const shareUrl = 'https://imagineexplainers.com/podcasts/682f9991ddc5142df79c0d85?shareUrl=d00ccfe9-5b2c-4a5f-8920-b98c1d4946c5';

export default function Page() {
  return (
    <main style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0 5rem' }}>
      <div className="container" style={{ display: 'grid', gap: '3.5rem' }}>
        <section style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.4rem', alignItems: 'center' }}>
            <Image
              src="https://nyc3.digitaloceanspaces.com/imagine-explainers/audio-explainers-thumbnail/677d671ccefba3c7c5245cb9/7142fb25-3d99-414c-804b-718842efe318"
              alt="Navigating the Autonomous Frontier cover art"
              width={160}
              height={160}
              style={{
                borderRadius: '28px',
                border: '1px solid rgba(86, 160, 255, 0.25)',
                boxShadow: '0 24px 45px rgba(6, 12, 34, 0.65)'
              }}
              priority
            />
            <div style={{ maxWidth: '600px' }}>
              <h1 className="section-title" style={{ marginBottom: '0.75rem' }}>
                Animated Podcast Companion
              </h1>
              <p className="section-subtitle" style={{ marginBottom: '1.5rem' }}>
                This immersive visual experience is generated directly from the voice track of the
                <strong> Navigating the Autonomous Frontier </strong> podcast episode. Press play to see the narration
                fuel dynamic particles, flowing gradients, and synchronized waveforms. Capture it as a shareable video in
                one click.
              </p>
              <div className="badge" style={{ background: 'rgba(86, 140, 255, 0.12)' }}>
                <span aria-hidden="true">🔗</span>
                <a href={shareUrl} target="_blank" rel="noreferrer">
                  Source Episode
                </a>
              </div>
            </div>
          </div>
        </section>

        <Visualizer />

        <section className="card" style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.4rem', marginTop: 0, marginBottom: '1rem' }}>How capture works</h2>
          <ol style={{ paddingLeft: '1.1rem', margin: 0, color: 'rgba(205, 222, 255, 0.75)', display: 'grid', gap: '1rem' }}>
            <li>
              Hit <strong>Record Full Video</strong> to arm the canvas and audio capture. The episode rewinds to the
              beginning automatically.
            </li>
            <li>
              Allow the visuals to play through. Everything is rendered in real time, mirroring the pacing of the voice
              over.
            </li>
            <li>
              Press <strong>Finish Recording</strong> once the closing words hit, or let the audio finish to finalize the
              render.
            </li>
            <li>
              Download the generated <code>.webm</code> file and publish anywhere video is welcome.
            </li>
          </ol>
        </section>

        <footer className="footer">
          Crafted for browsers and deployable to Vercel. Works best in Chromium-based browsers for full recording
          support.
        </footer>
      </div>
    </main>
  );
}

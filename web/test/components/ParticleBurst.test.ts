// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ParticleBurst from '~/components/ui/ParticleBurst.vue';

const particles = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAll('.particle-burst__particle');

describe('ParticleBurst', () => {
  it('renders one particle per requested count', () => {
    expect(particles(mount(ParticleBurst))).toHaveLength(7);
    expect(particles(mount(ParticleBurst, { props: { count: 3 } }))).toHaveLength(3);
  });

  it('gives every particle the custom properties the keyframes read', () => {
    const wrapper = mount(ParticleBurst, { props: { count: 4 } });
    for (const particle of particles(wrapper)) {
      const style = particle.attributes('style') ?? '';
      for (const property of ['--particle-x', '--particle-y', '--particle-size', '--particle-rotation', '--particle-color', '--particle-delay', '--particle-duration']) {
        expect(style).toContain(property);
      }
    }
  });

  it('offsets every particle delay by delayMs so the burst can be chained', () => {
    const wrapper = mount(ParticleBurst, { props: { count: 6, delayMs: 380 } });
    for (const particle of particles(wrapper)) {
      const delay = Number(/--particle-delay:\s*([\d.]+)ms/.exec(particle.attributes('style') ?? '')?.[1]);
      // delayMs plus up to the component's 100ms of stagger.
      expect(delay).toBeGreaterThanOrEqual(380);
      expect(delay).toBeLessThan(480);
    }
  });

  it('falls back to a circular dot and alternates its colour', () => {
    const wrapper = mount(ParticleBurst, {
      props: { count: 2, color: 'var(--mbl-success-bright)', altColor: 'var(--mbl-success)' },
    });
    expect(wrapper.findAll('.particle-burst__dot')).toHaveLength(2);
    const colours = particles(wrapper).map(particle =>
      /--particle-color:\s*([^;]+)/.exec(particle.attributes('style') ?? '')?.[1]?.trim(),
    );
    expect(colours).toEqual(['var(--mbl-success-bright)', 'var(--mbl-success)']);
  });

  it('renders slotted glyphs instead of the dot', () => {
    const wrapper = mount(ParticleBurst, {
      props: { count: 3 },
      slots: { default: '<i class="glyph" />' },
    });
    expect(wrapper.findAll('.glyph')).toHaveLength(3);
    expect(wrapper.find('.particle-burst__dot').exists()).toBe(false);
  });

  it('owns no timers, so unmounting mid-burst cannot leak one', () => {
    vi.useFakeTimers();
    try {
      const wrapper = mount(ParticleBurst, { props: { count: 5, delayMs: 380 } });
      expect(vi.getTimerCount()).toBe(0);
      wrapper.unmount();
      expect(vi.getTimerCount()).toBe(0);
    }
    finally {
      vi.useRealTimers();
    }
  });
});

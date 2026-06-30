'use client';
import Image from 'next/image';

export function TemplatesSection() {
  const templates = [
    {
      image: '/assets/led_blinking.svg',
      title: 'LED Blink',
      desc: 'The classic "Hello World" of electronics. Start here.'
    },
    {
      image: '/assets/traffic_light_controller.svg',
      title: 'Traffic Light Controller',
      desc: 'Manage complex timing sequences with multiple outputs.'
    },
    {
      image: '/assets/servo_sweep.svg',
      title: 'Servo Sweep',
      desc: 'Precise motor control and positioning using PWM signals.'
    },
    {
      image: '/assets/ultrasonic_distance_meter.svg',
      title: 'Ultrasonic Distance Meter',
      desc: 'Measure space with sound and LCD feedback.'
    },
    {
      image: '/assets/temperature_monitor.svg',
      title: 'Temperature Monitor',
      desc: 'Real-time environment sensing with DHT11 sensors.'
    },
    {
      image: '/assets/seven_segment_digit_count.svg',
      title: '7-Segment Digit Counter',
      desc: 'Master digital displays and logic multiplexing.'
    },
    {
      image: '/assets/button_debounce_demo.svg',
      title: 'Button Debounce Demo',
      desc: 'Learn reliable input handling for physical buttons.'
    },
    {
      image: '/assets/pwm_led_brightness.svg',
      title: 'PWM LED Brightness',
      desc: 'Smooth analog-style output using pulse width modulation.'
    }
  ];

  return (
    <section className="py-32 bg-surface-container-low border-t border-outline-variant/10 relative z-10">
      <div className="max-w-container-max mx-auto px-margin-desktop">
        
        <div className="text-center mb-20">
          <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-background tracking-tight">Built with Oscilink</h2>
          <p className="font-body-base text-on-surface-variant mt-4 max-w-2xl mx-auto text-lg">Explore community-built circuits and start your next project from a proven template.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {templates.map((template, idx) => (
            <div key={idx} className="bg-surface-bright p-6 rounded-lg border border-outline-variant/20 soft-shadow flex flex-col hover:border-primary/40 transition-all group">
              <div className="aspect-video rounded mb-4 overflow-hidden relative flex items-center justify-center">
                <Image src={template.image} alt={template.title} fill className="object-contain" />
              </div>
              <h3 className="font-headline-md text-lg text-on-surface mb-2">{template.title}</h3>
              <p className="font-body-base text-sm text-on-surface-variant leading-relaxed mb-6 flex-1">{template.desc}</p>
              <div className="flex items-center gap-2 text-primary font-bold text-sm cursor-pointer group/link">
                <span>Open in Simulator</span>
                <span className="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

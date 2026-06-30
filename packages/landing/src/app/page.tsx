'use client';

export default function Home() {
  const htmlContent = `
<!-- Global Background -->
<div class="fixed inset-0 z-0 pointer-events-none">
<div class="absolute inset-0 bg-gradient-to-tr from-surface via-surface-container-lowest to-surface-container-low opacity-60"></div>
<div class="absolute inset-0 circuit-grid opacity-30"></div>
</div>
<!-- Top Navigation Shell -->
<header class="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant">
<nav class="flex justify-between items-center px-margin-desktop py-4 max-w-container-max mx-auto">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-primary text-3xl" style="font-variation-settings: &quot;FILL&quot; 1;">bolt</span>
<span class="font-display-lg text-headline-md tracking-tighter text-on-surface">Oscilink</span>
</div>
<div class="hidden md:flex items-center gap-8"><a class="font-body-base text-on-surface font-bold border-b-2 border-primary pb-1" href="#">Features</a><a class="font-body-base text-on-surface-variant font-medium hover:text-primary transition-colors" href="#">For Teachers</a><a class="font-body-base text-on-surface-variant font-medium hover:text-primary transition-colors" href="#">Blogs</a></div>
<button class="bg-primary text-on-primary font-bold px-6 py-2 rounded-lg hover:opacity-90 transition-opacity soft-shadow" onclick="window.location.href='http://localhost:5173/'">
            Open Simulator
        </button>
</nav>
</header>
<main class="relative z-10 pt-[60px] min-h-screen">
<!-- Hero Section -->
<section class="max-w-container-max mx-auto px-margin-desktop grid grid-cols-1 lg:grid-cols-2 gap-gutter items-center min-h-[700px]">
<!-- Left Column: Content -->
<div class="flex flex-col gap-6" id="hero-content" style="transform: translate(0.1265px, 4.251px);">
<p class="font-label-caps text-label-caps text-primary tracking-widest uppercase">
                NO HARDWARE NEEDED. NO INSTALL. JUST OPEN A TAB.
            </p>
<h1 class="font-display-lg text-display-lg-mobile md:text-display-lg text-on-background leading-tight">
                Build Arduino Circuits. <br>
<span class="text-primary">In Your Browser.</span> <br>
                Right Now.
            </h1>
<p class="font-body-base text-on-surface-variant max-w-lg text-lg">
                Drag components. Write real C++. Hit Run. Watch your LED blink — powered by an actual AVR emulator, not a fake animation.
            </p>
<div class="flex flex-wrap gap-4 mt-4">
<button class="bg-primary text-on-primary font-bold px-8 py-4 rounded-lg flex items-center gap-2 hover:opacity-90 transition-all soft-shadow" onclick="window.location.href='http://localhost:5173/'">
                    Open Simulator
                    <span class="material-symbols-outlined">arrow_forward</span>
</button>
<button class="bg-surface-container border border-outline-variant text-primary font-bold px-8 py-4 rounded-lg flex items-center gap-2 hover:bg-surface-container-high transition-all">
                    See How It Works
                    <span class="material-symbols-outlined text-xl">arrow_downward</span>
</button>
</div>
<!-- Performance Indicator Chips -->
<div class="flex gap-4 mt-8">
<div class="bg-secondary-container/30 border border-secondary/20 px-3 py-1 rounded-full flex items-center gap-2">
<div class="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
<span class="font-code-sm text-xs text-secondary font-bold">AVR Core Active</span>
</div>
<div class="bg-primary/10 border border-primary/20 px-3 py-1 rounded-full flex items-center gap-2">
<span class="font-code-sm text-xs text-primary font-bold">0ms Latency</span>
</div>
</div>
</div>
<!-- Right Column: Soft Minimal Simulator Preview -->
<div class="relative lg:block hidden" id="simulator-preview" style="transform: translate(-0.759px, -25.506px);">
<!-- Main Window -->
<div class="bg-surface-container-lowest w-full aspect-video rounded-xl soft-shadow overflow-hidden flex flex-col border border-outline-variant relative">
<!-- Window Header -->
<div class="bg-surface-container-low px-4 py-3 flex justify-between items-center border-b border-outline-variant">
<div class="flex gap-1.5">
<div class="w-3 h-3 rounded-full bg-outline-variant"></div>
<div class="w-3 h-3 rounded-full bg-outline-variant"></div>
<div class="w-3 h-3 rounded-full bg-outline-variant"></div>
</div>
<div class="flex items-center gap-2 bg-white px-3 py-1 rounded text-primary text-xs font-code-sm border border-outline-variant">
<span class="material-symbols-outlined text-sm">developer_board</span>
                        sketch_blink_v1.ino
                    </div>
<div class="flex gap-3">
<span class="material-symbols-outlined text-on-surface-variant text-lg cursor-pointer">play_arrow</span>
<span class="material-symbols-outlined text-on-surface-variant text-lg cursor-pointer">settings</span>
</div>
</div>
<!-- Inner Layout -->
<div class="flex-1 grid grid-cols-5 overflow-hidden">
<!-- Left: Code Editor -->
<div class="col-span-2 border-r border-outline-variant bg-white p-4 font-code-sm text-[13px] leading-relaxed overflow-auto">
<div class="flex gap-4">
<div class="text-on-surface-variant/30 text-right select-none border-r border-outline-variant/10 pr-2">
                                1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br>10
                            </div>
<div class="text-on-surface-variant">
<span class="text-primary font-bold">void</span> setup() {<br>
                                &nbsp;&nbsp;<span class="text-secondary font-bold">pinMode</span>(13, OUTPUT);<br>
                                }<br><br>
<span class="text-primary font-bold">void</span> loop() {<br>
                                &nbsp;&nbsp;<span class="text-secondary font-bold">digitalWrite</span>(13, HIGH);<br>
                                &nbsp;&nbsp;<span class="text-secondary font-bold">delay</span>(1000);<br>
                                &nbsp;&nbsp;<span class="text-secondary font-bold">digitalWrite</span>(13, LOW);<br>
                                &nbsp;&nbsp;<span class="text-secondary font-bold">delay</span>(1000);<br>
                                }
                            </div>
</div>
</div>
<!-- Right: Circuit Canvas -->
<div class="col-span-3 bg-surface-bright relative circuit-grid flex items-center justify-center overflow-hidden">
<div class="relative w-64 h-64 flex items-center justify-center">
<!-- Arduino Mockup -->
<div class="absolute inset-0 rounded-lg shadow-sm flex items-center justify-center overflow-hidden bg-white">
<div class="relative w-full h-full flex items-center justify-center">
<img alt="Arduino Uno" class="w-full h-full object-contain" src="/assets/hero_image.svg">
<!-- Soft Red Glow Overlay -->
<div class="absolute w-4 h-3 bg-error rounded-t-full rounded-b-sm opacity-90" style="top: 6%; left: 44.5%; animation: led-pulse 2s ease-in-out infinite; box-shadow: 0 0 20px 5px #ba1a1a;"></div>
</div>
</div>
</div>
<!-- Bottom: Serial Monitor Overlay -->
<div class="absolute bottom-4 left-4 right-4 bg-white/90 border border-outline-variant rounded p-2 font-code-sm text-[11px] soft-shadow">
<div class="flex justify-between items-center mb-1 text-on-surface-variant/60 border-b border-outline-variant/10 pb-1">
<span class="">SERIAL MONITOR</span>
<span class="">9600 BAUD</span>
</div>
<div class="text-on-surface-variant font-medium">
                                &gt; System initialized...<br>
                                &gt; LED_PIN 13 -&gt; HIGH
                            </div>
</div>
</div>
</div>
</div>
<!-- Floating Tool Palette -->
<div class="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col gap-3">
<div class="bg-white p-3 rounded-xl soft-shadow border border-outline-variant hover:border-primary transition-all cursor-pointer">
<span class="material-symbols-outlined text-primary" style="font-variation-settings: &quot;FILL&quot; 1;">add</span>
</div>
<div class="bg-white p-3 rounded-xl soft-shadow border border-outline-variant hover:border-primary transition-all cursor-pointer">
<span class="material-symbols-outlined text-on-surface-variant">search</span>
</div>
</div>
</div>
</section>
<!-- Section 02: Sound familiar? -->
<section class="bg-surface-container-low py-24 border-y border-outline-variant/10">
<div class="max-w-container-max mx-auto px-margin-desktop">
<div class="text-center mb-16">
<h2 class="font-display-lg text-display-lg-mobile md:text-headline-md text-on-surface mb-4 tracking-tight">Sound familiar?</h2>
<div class="w-16 h-1 bg-primary/20 mx-auto rounded-full"></div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-8"><!-- Card 1 -->
<div class="bg-surface-bright p-8 rounded-2xl border border-outline-variant/20 soft-shadow group hover:border-primary/40 transition-all hover:-translate-y-1">
<div class="flex items-start gap-6">
<div class="w-16 h-16 rounded-2xl bg-error/5 flex items-center justify-center shrink-0">
<span class="material-symbols-outlined text-error text-3xl">schedule</span>
</div>
<div>
<h3 class="font-headline-md text-lg text-on-surface mb-2">Limited Lab Access</h3>
<p class="font-body-base text-on-surface-variant leading-relaxed">Your college lab is open 2 hours a week. You have 4 assignments due and a line out the door.</p>
</div>
</div>
</div>
<!-- Card 2 -->
<div class="bg-surface-bright p-8 rounded-2xl border border-outline-variant/20 soft-shadow group hover:border-primary/40 transition-all hover:-translate-y-1">
<div class="flex items-start gap-6">
<div class="w-16 h-16 rounded-2xl bg-error/5 flex items-center justify-center shrink-0">
<span class="material-symbols-outlined text-error text-3xl">electrical_services</span>
</div>
<div>
<h3 class="font-headline-md text-lg text-on-surface mb-2">Expensive Mistakes</h3>
<p class="font-body-base text-on-surface-variant leading-relaxed">You accidentally shorted your Arduino. ₹800 gone. Lab sir is not happy, and neither is your wallet.</p>
</div>
</div>
</div>
<!-- Card 3 -->
<div class="bg-surface-bright p-8 rounded-2xl border border-outline-variant/20 soft-shadow group hover:border-primary/40 transition-all hover:-translate-y-1">
<div class="flex items-start gap-6">
<div class="w-16 h-16 rounded-2xl bg-error/5 flex items-center justify-center shrink-0">
<span class="material-symbols-outlined text-error text-3xl">heart_broken</span>
</div>
<div>
<h3 class="font-headline-md text-lg text-on-surface mb-2">Unreliable Tools</h3>
<p class="font-body-base text-on-surface-variant leading-relaxed">Your browser-based tool crashed again. You've spent 20 minutes making an account just to lose your progress.</p>
</div>
</div>
</div>
<!-- Card 4 -->
<div class="bg-surface-bright p-8 rounded-2xl border border-outline-variant/20 soft-shadow group hover:border-primary/40 transition-all hover:-translate-y-1">
<div class="flex items-start gap-6">
<div class="w-16 h-16 rounded-2xl bg-error/5 flex items-center justify-center shrink-0">
<span class="material-symbols-outlined text-error text-3xl">dark_mode</span>
</div>
<div>
<h3 class="font-headline-md text-lg text-on-surface mb-2">The 1 AM Inspiration</h3>
<p class="font-body-base text-on-surface-variant leading-relaxed">It's 1 AM. You want to practice. Your kit is in your locker, and the lab is locked tight.</p>
</div>
</div>
</div></div>
<div class="mt-20 text-center">
<div class="inline-flex items-center gap-3 px-6 py-3 bg-primary/5 rounded-full border border-primary/10">
<span class="material-symbols-outlined text-primary text-sm">favorite</span>
<p class="font-body-base text-on-surface-variant italic">We built this because we've been there too.</p>
</div>
</div>
</div>
</section>
<!-- Section 03: How It Works - Variant 2: The Step-by-Step Cards -->
<section class="py-32 bg-surface">
<div class="max-w-container-max mx-auto px-margin-desktop">
<div class="text-center mb-20">
<h2 class="font-display-lg text-display-lg-mobile md:text-display-lg text-on-background tracking-tight">Three steps from idea to running circuit</h2>
<p class="font-body-base text-on-surface-variant mt-4 max-w-2xl mx-auto text-lg">We simplified the complex world of electronics into a seamless browser experience.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
<!-- Step 1 Card -->
<div class="flex flex-col bg-surface-bright rounded-xl border border-outline-variant/20 soft-shadow overflow-hidden group hover:-translate-y-1 transition-transform">
<div class="aspect-video w-full overflow-hidden bg-surface-container-low border-b border-outline-variant/10 relative flex">
  <!-- Component Panel -->
  <div class="w-1/4 shrink-0 h-full bg-white border-r border-outline-variant/20 flex flex-col p-3 gap-3 z-0">
    <div class="w-full h-2 bg-outline-variant/20 rounded-full"></div>
    <div class="w-full h-2 bg-outline-variant/20 rounded-full w-2/3"></div>
    <!-- Arduino placeholder in panel -->
    <div class="w-full aspect-square border border-outline-variant/30 rounded-lg bg-surface-bright flex items-center justify-center p-2 mt-2">
      <img alt="Arduino Uno placeholder" class="w-full h-full object-contain opacity-20 grayscale" src="/assets/arduino_board.png">
    </div>
    <div class="w-full aspect-square border border-outline-variant/30 rounded-lg bg-surface-bright flex items-center justify-center p-2">
       <div class="w-6 h-6 rounded-full bg-error/20 border border-error/50"></div>
    </div>
  </div>
  
  <!-- Canvas Area -->
  <div class="flex-1 h-full circuit-grid relative overflow-hidden">
  </div>
  
  <!-- Animated Arduino -->
  <div class="absolute w-16 h-16 rounded-lg p-2 flex items-center justify-center z-10 -translate-x-1/2 -translate-y-1/2" style="animation: drag-arduino 3s ease-in-out infinite;">
    <img alt="Arduino Uno" class="w-full h-full object-contain" src="/assets/arduino_board.png">
      <!-- Mouse cursor pointer -->
      <div class="absolute -bottom-3 -right-3 z-20 pointer-events-none" style="animation: cursor-drop 3s ease-in-out infinite;">
        <div class="absolute w-4 h-4 bg-yellow-400/60 rounded-full" style="top: -2px; left: -2px; animation: click-ring 3s ease-in-out infinite;"></div>
        <span class="material-symbols-outlined text-on-surface text-xl drop-shadow-md relative z-10 block" style="font-variation-settings: 'FILL' 1;">arrow_selector_tool</span>
      </div>
  </div>
</div>
<div class="p-8 flex flex-col flex-1">
<div class="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-[10px] mb-4 tracking-widest uppercase w-fit">Step 01</div>
<h3 class="font-headline-md text-xl text-on-background mb-3">Drag your components</h3>
<p class="font-body-base text-on-surface-variant leading-relaxed mb-6 flex-1">Drop an Arduino Uno, resistors, and LEDs onto the infinite canvas. Connect them with wires, just like on a breadboard.</p>
<div class="flex items-center gap-2 text-primary font-bold text-sm cursor-pointer group/link">
<span class="">Explore library</span>
<span class="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
</div>
<!-- Step 2 Card -->
<div class="flex flex-col bg-surface-bright rounded-xl border border-outline-variant/20 soft-shadow overflow-hidden group hover:-translate-y-1 transition-transform">
<div class="aspect-video w-full overflow-hidden bg-surface-bright border-b border-outline-variant/10 relative p-5 flex flex-col font-code-sm text-xs leading-relaxed text-[#333333]">
  <!-- Editor window dots -->
  <div class="flex gap-1.5 mb-5 opacity-80">
    <div class="w-2.5 h-2.5 rounded-full bg-[#FF5F56]"></div>
    <div class="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"></div>
    <div class="w-2.5 h-2.5 rounded-full bg-[#27C93F]"></div>
  </div>
  
  <div class="flex h-full">
    <div class="text-tertiary-container text-right select-none pr-3 border-r border-outline-variant/20 mr-3 flex flex-col gap-1">
      <span>1</span><span>2</span><span>3</span>
    </div>
    <div class="flex flex-col relative w-full gap-1">
      <div class="overflow-hidden whitespace-nowrap" style="animation: type-l1 5s infinite;">
        <span class="text-[#00979D] font-bold">void</span> <span class="text-[#D35400]">setup</span>() {
      </div>
      <div class="overflow-hidden whitespace-nowrap opacity-0" style="animation: type-l2 5s infinite;">
        &nbsp;&nbsp;<span class="text-[#D35400]">pinMode</span>(<span class="text-[#000000]">13</span>, <span class="text-[#00979D]">OUTPUT</span>);
      </div>
      <div class="overflow-hidden whitespace-nowrap opacity-0" style="animation: type-l3 5s infinite;">
        }
      </div>
    </div>
  </div>
</div>
<div class="p-8 flex flex-col flex-1">
<div class="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-[10px] mb-4 tracking-widest uppercase w-fit">Step 02</div>
<h3 class="font-headline-md text-xl text-on-background mb-3">Write your code</h3>
<p class="font-body-base text-on-surface-variant leading-relaxed mb-6 flex-1">The built-in editor speaks real Arduino C++. No transpiling, no workaround syntax. If it runs on a board, it runs here.</p>
<div class="flex items-center gap-2 text-primary font-bold text-sm cursor-pointer group/link">
<span class="">AVR Core details</span>
<span class="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
</div>
<!-- Step 3 Card -->
<div class="flex flex-col bg-surface-bright rounded-xl border border-outline-variant/20 soft-shadow overflow-hidden group hover:-translate-y-1 transition-transform">
<div class="aspect-video w-full overflow-hidden bg-surface-bright circuit-grid border-b border-outline-variant/10 relative p-5 flex items-center justify-center">
  <!-- Toolbar -->
  <div class="flex items-center bg-surface-container-low rounded-full px-2 py-1.5 shadow-sm border border-outline-variant/30 gap-3 relative z-10">
    
    <!-- Play button -->
    <div class="relative w-7 h-7 flex items-center justify-center">
      <span class="material-symbols-outlined text-xl text-[#3A6B53] absolute" style="font-variation-settings: 'FILL' 1; animation: play-solid 6s infinite;">play_arrow</span>
      <span class="material-symbols-outlined text-xl text-[#A5B3AC] absolute" style="font-variation-settings: 'FILL' 0; animation: play-out 6s infinite;">play_arrow</span>
    </div>
    
    <!-- Stop button -->
    <div class="relative w-7 h-7 flex items-center justify-center">
      <span class="material-symbols-outlined text-xl text-[#3A6B53] absolute" style="font-variation-settings: 'FILL' 1; animation: stop-solid 6s infinite;">square</span>
      <span class="material-symbols-outlined text-xl text-[#A5B3AC] absolute" style="font-variation-settings: 'FILL' 0; animation: stop-out 6s infinite;">square</span>
    </div>
    
    <!-- Divider -->
    <div class="w-[1px] h-5 bg-outline-variant/40"></div>
    
    <!-- Compile button -->
    <button class="relative flex items-center justify-center text-white rounded-full text-sm font-bold shadow-sm w-[125px] h-8 overflow-hidden" style="animation: run-bg 6s infinite;">
      <div class="flex items-center gap-1.5 absolute" style="animation: run-t1 6s infinite;">
        <span>Compile</span>
        <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">bolt</span>
      </div>
      <div class="flex items-center gap-1.5 absolute" style="animation: run-t2 6s infinite;">
        <span>Compiling...</span>
        <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">bolt</span>
      </div>
    </button>
    
    <!-- Mouse cursor -->
    <div class="absolute right-[30px] top-[15px] z-20 pointer-events-none" style="animation: mouse-compile 6s infinite;">
      <div class="absolute w-4 h-4 bg-yellow-400/60 rounded-full" style="top: -2px; left: -2px; animation: ring-compile 6s infinite;"></div>
      <span class="material-symbols-outlined text-on-surface text-xl drop-shadow-md relative z-10 block" style="font-variation-settings: 'FILL' 1;">arrow_selector_tool</span>
    </div>
    
  </div>
</div>
<div class="p-8 flex flex-col flex-1">
<div class="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-[10px] mb-4 tracking-widest uppercase w-fit">Step 03</div>
<h3 class="font-headline-md text-xl text-on-background mb-3">Hit Run</h3>
<p class="font-body-base text-on-surface-variant leading-relaxed mb-6 flex-1">A real AVR emulator executes your code. Your LED blinks on exact timing and your Serial Monitor prints live data.</p>
<div class="flex items-center gap-2 text-primary font-bold text-sm cursor-pointer group/link">
<span class="">Try live demo</span>
<span class="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
</div>
</div>
</div>
</section><section class="py-24 bg-surface-bright border-t border-outline-variant/10">
<div class="max-w-container-max mx-auto px-margin-desktop">
<div class="text-center mb-16">
<h2 class="font-display-lg text-display-lg-mobile md:text-headline-md text-on-surface mb-4 tracking-tight">Engineered for depth</h2>
<div class="w-16 h-1 bg-primary/20 mx-auto rounded-full"></div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
<!-- Card 1 -->
<div class="bg-surface-container-low p-8 rounded-lg border border-outline-variant/20 soft-shadow hover:border-primary/40 transition-all">
<span class="material-symbols-outlined text-primary text-3xl mb-4">memory</span>
<h3 class="font-headline-md text-lg text-on-surface mb-2">Real AVR Emulator</h3>
<p class="font-body-base text-sm text-on-surface-variant leading-relaxed">Not fake animation. Real compiled C++ running on a virtual ATmega328P.</p>
</div>
<!-- Card 2 -->
<div class="bg-surface-container-low p-8 rounded-lg border border-outline-variant/20 soft-shadow hover:border-primary/40 transition-all">
<span class="material-symbols-outlined text-primary text-3xl mb-4">code</span>
<h3 class="font-headline-md text-lg text-on-surface mb-2">Built-in Code Editor</h3>
<p class="font-body-base text-sm text-on-surface-variant leading-relaxed">Syntax highlighting, autocomplete, and error feedback. Feels like Arduino IDE, loads in 2 seconds.</p>
</div>
<!-- Card 3 -->
<div class="bg-surface-container-low p-8 rounded-lg border border-outline-variant/20 soft-shadow hover:border-primary/40 transition-all">
<span class="material-symbols-outlined text-primary text-3xl mb-4">terminal</span>
<h3 class="font-headline-md text-lg text-on-surface mb-2">Live Serial Monitor</h3>
<p class="font-body-base text-sm text-on-surface-variant leading-relaxed">Your Serial.println() actually prints. Debug your code like you would on real hardware.</p>
</div>
<!-- Card 4 -->
<div class="bg-surface-container-low p-8 rounded-lg border border-outline-variant/20 soft-shadow hover:border-primary/40 transition-all">
<span class="material-symbols-outlined text-primary text-3xl mb-4">inventory_2</span>
<h3 class="font-headline-md text-lg text-on-surface mb-2">Component Library</h3>
<p class="font-body-base text-sm text-on-surface-variant leading-relaxed">Resistors, LEDs, buttons, LCDs, servos, ultrasonic sensors, and more. Growing every month.</p>
</div>
<!-- Card 5 -->
<div class="bg-surface-container-low p-8 rounded-lg border border-outline-variant/20 soft-shadow hover:border-primary/40 transition-all">
<span class="material-symbols-outlined text-primary text-3xl mb-4">zoom_out_map</span>
<h3 class="font-headline-md text-lg text-on-surface mb-2">Infinite Canvas</h3>
<p class="font-body-base text-sm text-on-surface-variant leading-relaxed">Zoom in, zoom out, pan. Build circuits as small or as complex as you need.</p>
</div>
<!-- Card 6 -->
<div class="bg-surface-container-low p-8 rounded-lg border border-outline-variant/20 soft-shadow hover:border-primary/40 transition-all">
<span class="material-symbols-outlined text-primary text-3xl mb-4">share</span>
<h3 class="font-headline-md text-lg text-on-surface mb-2">Save &amp; Share</h3>
<p class="font-body-base text-sm text-on-surface-variant leading-relaxed">One link to share your circuit with a classmate, student, or the internet. No account required to view.</p>
</div>
</div>
</div>
</section>
<!-- Bento Grid: Features -->
</main>
<section class="py-32 bg-surface border-t border-outline-variant/10 relative z-10">
<div class="max-w-container-max mx-auto px-margin-desktop">
<div class="text-center mb-20">
<h2 class="font-display-lg text-display-lg-mobile md:text-display-lg text-on-background tracking-tight">Built for every stage of the journey</h2>
<p class="font-body-base text-on-surface-variant mt-4 max-w-2xl mx-auto text-lg">Whether you're learning the basics or prototyping your next big invention.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
<!-- Students Card -->
<div class="bg-surface-container-low p-8 rounded-lg border border-outline-variant/20 soft-shadow flex flex-col hover:border-primary/40 transition-all">
<div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
<span class="material-symbols-outlined text-primary text-2xl">school</span>
</div>
<h3 class="font-headline-md text-xl text-on-surface mb-3">For Students</h3>
<p class="font-body-base text-on-surface-variant leading-relaxed mb-8 flex-1">Practice Arduino at 1 AM from your hostel room. No kit. No permission. No ₹800 at risk. Just open a tab and build.</p>
<div class="flex items-center gap-2 text-primary font-bold text-sm cursor-pointer group/link">
<span class="">Start practicing</span>
<span class="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
<!-- Teachers Card -->
<div class="bg-surface-container-low p-8 rounded-lg border border-outline-variant/20 soft-shadow flex flex-col hover:border-primary/40 transition-all">
<div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
<span class="material-symbols-outlined text-primary text-2xl">group</span>
</div>
<h3 class="font-headline-md text-xl text-on-surface mb-3">For Teachers</h3>
<p class="font-body-base text-on-surface-variant leading-relaxed mb-8 flex-1">Stop spending your demo slot untangling wires. Build the circuit once, share a link with your whole class, and let them follow along on their own screen.</p>
<div class="flex items-center gap-2 text-primary font-bold text-sm cursor-pointer group/link">
<span class="">See classroom features</span>
<span class="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
<!-- Hobbyists Card -->
<div class="bg-surface-container-low p-8 rounded-lg border border-outline-variant/20 soft-shadow flex flex-col hover:border-primary/40 transition-all">
<div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
<span class="material-symbols-outlined text-primary text-2xl">construction</span>
</div>
<h3 class="font-headline-md text-xl text-on-surface mb-3">For Hobbyists</h3>
<p class="font-body-base text-on-surface-variant leading-relaxed mb-8 flex-1">Test your idea completely in the browser before you order the parts. Know it works before you spend ₹2000 on components.</p>
<div class="flex items-center gap-2 text-primary font-bold text-sm cursor-pointer group/link">
<span class="">Try your idea</span>
<span class="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
</div>
</div>
</section><section class="py-32 bg-surface-container-low border-t border-outline-variant/10 relative z-10">
<div class="max-w-container-max mx-auto px-margin-desktop">
<div class="text-center mb-20">
<h2 class="font-display-lg text-display-lg-mobile md:text-display-lg text-on-background tracking-tight">Built with Oscilink</h2>
<p class="font-body-base text-on-surface-variant mt-4 max-w-2xl mx-auto text-lg">Explore community-built circuits and start your next project from a proven template.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
<!-- Card 1 -->
<div class="bg-surface-bright p-6 rounded-lg border border-outline-variant/20 soft-shadow flex flex-col hover:border-primary/40 transition-all group">
<div class="aspect-video bg-surface-container-low rounded mb-4 overflow-hidden flex items-center justify-center relative">
<img src="/assets/led_blinking.svg" alt="LED Blink" class="object-contain p-4 w-full h-full" />
</div>
<h3 class="font-headline-md text-lg text-on-surface mb-2">LED Blink</h3>
<p class="font-body-base text-sm text-on-surface-variant leading-relaxed mb-6 flex-1">The classic "Hello World" of electronics. Start here.</p>
<div class="flex items-center gap-2 text-primary font-bold text-sm cursor-pointer group/link">
<span class="">Open in Simulator</span>
<span class="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
<!-- Card 2 -->
<div class="bg-surface-bright p-6 rounded-lg border border-outline-variant/20 soft-shadow flex flex-col hover:border-primary/40 transition-all group">
<div class="aspect-video bg-surface-container-low rounded mb-4 overflow-hidden flex items-center justify-center relative">
<img src="/assets/traffic_light_controller.svg" alt="Traffic Light Controller" class="object-contain p-4 w-full h-full" />
</div>
<h3 class="font-headline-md text-lg text-on-surface mb-2">Traffic Light Controller</h3>
<p class="font-body-base text-sm text-on-surface-variant leading-relaxed mb-6 flex-1">Manage complex timing sequences with multiple outputs.</p>
<div class="flex items-center gap-2 text-primary font-bold text-sm cursor-pointer group/link">
<span class="">Open in Simulator</span>
<span class="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
<!-- Card 3 -->
<div class="bg-surface-bright p-6 rounded-lg border border-outline-variant/20 soft-shadow flex flex-col hover:border-primary/40 transition-all group">
<div class="aspect-video bg-surface-container-low rounded mb-4 overflow-hidden flex items-center justify-center relative">
<img src="/assets/servo_sweep.svg" alt="Servo Sweep" class="object-contain p-4 w-full h-full" />
</div>
<h3 class="font-headline-md text-lg text-on-surface mb-2">Servo Sweep</h3>
<p class="font-body-base text-sm text-on-surface-variant leading-relaxed mb-6 flex-1">Precise motor control and positioning using PWM signals.</p>
<div class="flex items-center gap-2 text-primary font-bold text-sm cursor-pointer group/link">
<span class="">Open in Simulator</span>
<span class="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
<!-- Card 4 -->
<div class="bg-surface-bright p-6 rounded-lg border border-outline-variant/20 soft-shadow flex flex-col hover:border-primary/40 transition-all group">
<div class="aspect-video bg-surface-container-low rounded mb-4 overflow-hidden flex items-center justify-center relative">
<img src="/assets/ultrasonic_distance_meter.svg" alt="Ultrasonic Distance Meter" class="object-contain p-4 w-full h-full" />
</div>
<h3 class="font-headline-md text-lg text-on-surface mb-2">Ultrasonic Distance Meter</h3>
<p class="font-body-base text-sm text-on-surface-variant leading-relaxed mb-6 flex-1">Measure space with sound and LCD feedback.</p>
<div class="flex items-center gap-2 text-primary font-bold text-sm cursor-pointer group/link">
<span class="">Open in Simulator</span>
<span class="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
<!-- Card 5 -->
<div class="bg-surface-bright p-6 rounded-lg border border-outline-variant/20 soft-shadow flex flex-col hover:border-primary/40 transition-all group">
<div class="aspect-video bg-surface-container-low rounded mb-4 overflow-hidden flex items-center justify-center relative">
<img src="/assets/temperature_monitor.svg" alt="Temperature Monitor" class="object-contain p-4 w-full h-full" />
</div>
<h3 class="font-headline-md text-lg text-on-surface mb-2">Temperature Monitor</h3>
<p class="font-body-base text-sm text-on-surface-variant leading-relaxed mb-6 flex-1">Real-time environment sensing with DHT11 sensors.</p>
<div class="flex items-center gap-2 text-primary font-bold text-sm cursor-pointer group/link">
<span class="">Open in Simulator</span>
<span class="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
<!-- Card 6 -->
<div class="bg-surface-bright p-6 rounded-lg border border-outline-variant/20 soft-shadow flex flex-col hover:border-primary/40 transition-all group">
<div class="aspect-video bg-surface-container-low rounded mb-4 overflow-hidden flex items-center justify-center relative">
<img src="/assets/seven_segment_digit_count.svg" alt="7-Segment Digit Counter" class="object-contain p-4 w-full h-full" />
</div>
<h3 class="font-headline-md text-lg text-on-surface mb-2">7-Segment Digit Counter</h3>
<p class="font-body-base text-sm text-on-surface-variant leading-relaxed mb-6 flex-1">Master digital displays and logic multiplexing.</p>
<div class="flex items-center gap-2 text-primary font-bold text-sm cursor-pointer group/link">
<span class="">Open in Simulator</span>
<span class="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
<!-- Card 7 -->
<div class="bg-surface-bright p-6 rounded-lg border border-outline-variant/20 soft-shadow flex flex-col hover:border-primary/40 transition-all group">
<div class="aspect-video bg-surface-container-low rounded mb-4 overflow-hidden flex items-center justify-center relative">
<img src="/assets/button_debounce_demo.svg" alt="Button Debounce Demo" class="object-contain p-4 w-full h-full" />
</div>
<h3 class="font-headline-md text-lg text-on-surface mb-2">Button Debounce Demo</h3>
<p class="font-body-base text-sm text-on-surface-variant leading-relaxed mb-6 flex-1">Learn reliable input handling for physical buttons.</p>
<div class="flex items-center gap-2 text-primary font-bold text-sm cursor-pointer group/link">
<span class="">Open in Simulator</span>
<span class="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
<!-- Card 8 -->
<div class="bg-surface-bright p-6 rounded-lg border border-outline-variant/20 soft-shadow flex flex-col hover:border-primary/40 transition-all group">
<div class="aspect-video bg-surface-container-low rounded mb-4 overflow-hidden flex items-center justify-center relative">
<img src="/assets/pwm_led_brightness.svg" alt="PWM LED Brightness" class="object-contain p-4 w-full h-full" />
</div>
<h3 class="font-headline-md text-lg text-on-surface mb-2">PWM LED Brightness</h3>
<p class="font-body-base text-sm text-on-surface-variant leading-relaxed mb-6 flex-1">Smooth analog-style output using pulse width modulation.</p>
<div class="flex items-center gap-2 text-primary font-bold text-sm cursor-pointer group/link">
<span class="">Open in Simulator</span>
<span class="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
</div>
</div>
</section><section class="py-24 bg-surface relative z-10">
<!-- Metrics Strip -->
<div class="w-full bg-surface-container-low border-y border-outline-variant/10 py-12 mb-24">
<div class="max-w-container-max mx-auto px-margin-desktop flex justify-center items-center">
<p class="font-headline-md text-headline-md text-primary tracking-widest uppercase flex items-center gap-6">
<span class="">Launching Beta</span>
<span class="w-2 h-2 rounded-full bg-primary/30"></span>
<span class="">New Features Every Week</span>
<span class="w-2 h-2 rounded-full bg-primary/30"></span>
<span class="">feel free to try</span>
</p>
</div>
</div>
<!-- Testimonials -->
<div class="max-w-container-max mx-auto px-margin-desktop">
<div class="text-center mb-16">
<h2 class="font-headline-md text-headline-md text-on-surface mb-4">Trusted by the next generation of engineers</h2>
<div class="w-16 h-1 bg-primary/20 mx-auto rounded-full"></div>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
<!-- Testimonial 1 -->
<div class="bg-surface-bright p-8 rounded-lg border border-outline-variant/20 soft-shadow flex flex-col">
<div class="flex items-center gap-4 mb-6">
<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
<span class="material-symbols-outlined text-primary">person</span>
</div>
<div>
<h4 class="font-headline-md text-sm text-on-surface">Priya R.</h4>
<p class="text-xs text-on-surface-variant">3rd Year ECE, NIT Trichy</p>
</div>
</div>
<p class="font-body-base text-on-surface-variant leading-relaxed italic flex-1">
                    "I was stressed about my ECE lab practical the night before. I opened Oscilink, built the sensor circuit, fixed my code three times, and walked in confident. It's literally free practice with zero risk."
                </p>
</div>
<!-- Testimonial 2 -->
<div class="bg-surface-bright p-8 rounded-lg border border-outline-variant/20 soft-shadow flex flex-col">
<div class="flex items-center gap-4 mb-6">
<div class="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center overflow-hidden">
<span class="material-symbols-outlined text-secondary">school</span>
</div>
<div>
<h4 class="font-headline-md text-sm text-on-surface">Dr. Aruna V.</h4>
<p class="text-xs text-on-surface-variant">Dept of Electrical Engineering</p>
</div>
</div>
<p class="font-body-base text-on-surface-variant leading-relaxed italic flex-1">
                    "Oscilink changed how I teach microcontrollers. Instead of 40 students crowding around one breadboard, I share a link and everyone follows along on their own laptop. The engagement is night and day."
                </p>
</div>
<!-- Testimonial 3 -->
<div class="bg-surface-bright p-8 rounded-lg border border-outline-variant/20 soft-shadow flex flex-col">
<div class="flex items-center gap-4 mb-6">
<div class="w-12 h-12 rounded-full bg-tertiary-container/10 flex items-center justify-center overflow-hidden">
<span class="material-symbols-outlined text-tertiary">engineering</span>
</div>
<div>
<h4 class="font-headline-md text-sm text-on-surface">Rahul K.</h4>
<p class="text-xs text-on-surface-variant">IoT Hobbyist &amp; Maker</p>
</div>
</div>
<p class="font-body-base text-on-surface-variant leading-relaxed italic flex-1">
                    "I practiced the IR sensor circuit 8 times before my lab exam and got full marks. Being able to debug logic errors without blowing up actual components saved me so much frustration and money."
                </p>
</div>
</div>
</div>
</section><section class="py-32 bg-surface relative z-10 border-t border-outline-variant/10">
<div class="max-w-container-max mx-auto px-margin-desktop">
<div class="text-center mb-16">
<h2 class="font-display-lg text-display-lg-mobile md:text-display-lg text-on-background tracking-tight mb-4">Oscilink vs. The Alternatives</h2>
<p class="font-body-base text-on-surface-variant text-lg">Built for your workflow. See how Oscilink compares to other learning methods.</p>
</div>
<div class="overflow-x-auto">
<table class="w-full border-collapse rounded-xl overflow-hidden soft-shadow bg-surface-bright">
<thead>
<tr class="bg-surface-container-low border-b border-outline-variant">
<th class="p-6 text-left font-headline-md text-on-surface">Feature</th>
<th class="p-6 text-center font-headline-md text-primary bg-primary/5">Oscilink</th>
<th class="p-6 text-center font-headline-md text-on-surface-variant">Other Simulators</th>
<th class="p-6 text-center font-headline-md text-on-surface-variant">Physical Kit</th>
</tr>
</thead>
<tbody class="font-body-base text-on-surface">
<tr class="border-b border-outline-variant/10">
<td class="p-6 font-medium">Real AVR emulation</td>
<td class="p-6 text-center bg-primary/5 font-bold text-primary"><span class="material-symbols-outlined">check_circle</span></td>
<td class="p-6 text-center text-on-surface-variant/60">Partial</td>
<td class="p-6 text-center"><span class="material-symbols-outlined">check_circle</span></td>
</tr>
<tr class="border-b border-outline-variant/10">
<td class="p-6 font-medium">No account required</td>
<td class="p-6 text-center bg-primary/5 font-bold text-primary"><span class="material-symbols-outlined">check_circle</span></td>
<td class="p-6 text-center text-error"><span class="material-symbols-outlined">cancel</span></td>
<td class="p-6 text-center text-on-surface-variant/30">N/A</td>
</tr>
<tr class="border-b border-outline-variant/10">
<td class="p-6 font-medium">Modern drag-drop UI</td>
<td class="p-6 text-center bg-primary/5 font-bold text-primary"><span class="material-symbols-outlined">check_circle</span></td>
<td class="p-6 text-center text-error"><span class="material-symbols-outlined">cancel</span></td>
<td class="p-6 text-center text-on-surface-variant/30">N/A</td>
</tr>
<tr class="border-b border-outline-variant/10">
<td class="p-6 font-medium">Runs at midnight</td>
<td class="p-6 text-center bg-primary/5 font-bold text-primary"><span class="material-symbols-outlined">check_circle</span></td>
<td class="p-6 text-center"><span class="material-symbols-outlined">check_circle</span></td>
<td class="p-6 text-center text-error"><span class="material-symbols-outlined">cancel</span></td>
</tr>
<tr class="border-b border-outline-variant/10">
<td class="p-6 font-medium">Zero risk of damage</td>
<td class="p-6 text-center bg-primary/5 font-bold text-primary"><span class="material-symbols-outlined">check_circle</span></td>
<td class="p-6 text-center"><span class="material-symbols-outlined">check_circle</span></td>
<td class="p-6 text-center text-error"><span class="material-symbols-outlined">cancel</span></td>
</tr>
<tr class="border-b border-outline-variant/10">
<td class="p-6 font-medium">Costs ₹0</td>
<td class="p-6 text-center bg-primary/5 font-bold text-primary"><span class="material-symbols-outlined">check_circle</span></td>
<td class="p-6 text-center text-on-surface-variant/60">₹0–$$$$</td>
<td class="p-6 text-center text-on-surface-variant/60">₹3000+</td>
</tr>
<tr>
<td class="p-6 font-medium">Share with one link</td>
<td class="p-6 text-center bg-primary/5 font-bold text-primary"><span class="material-symbols-outlined">check_circle</span></td>
<td class="p-6 text-center text-on-surface-variant/60">Partial</td>
<td class="p-6 text-center text-error"><span class="material-symbols-outlined">cancel</span></td>
</tr>
</tbody>
</table>
</div>
</div>
</section><section class="py-32 bg-surface relative z-10 border-t border-outline-variant/10">
<div class="max-w-container-max mx-auto px-margin-desktop">
<div class="text-center mb-20">
<h2 class="font-display-lg text-display-lg-mobile md:text-display-lg text-on-background tracking-tight mb-4">Frequently Asked Questions</h2>
<div class="w-16 h-1 bg-primary/20 mx-auto rounded-full"></div>
</div>
<div class="max-w-3xl mx-auto flex flex-col gap-4">
<!-- Q1 -->
<div class="bg-surface-container-low p-6 rounded-xl border border-outline-variant/20 soft-shadow">
<h3 class="font-headline-md text-lg text-on-surface mb-2">Is this actually free?</h3>
<p class="font-body-base text-on-surface-variant">Yes. No credit card, no trial, no hidden limit. Open it and start building.</p>
</div>
<!-- Q2 -->
<div class="bg-surface-container-low p-6 rounded-xl border border-outline-variant/20 soft-shadow">
<h3 class="font-headline-md text-lg text-on-surface mb-2">Does it run real Arduino code, or is it a simplified version?</h3>
<p class="font-body-base text-on-surface-variant">Real. You write standard Arduino C++. It compiles using the same toolchain as the real IDE and runs on a virtual ATmega328P. If it's valid Arduino code, it runs.</p>
</div>
<!-- Q3 -->
<div class="bg-surface-container-low p-6 rounded-xl border border-outline-variant/20 soft-shadow">
<h3 class="font-headline-md text-lg text-on-surface mb-2">Do I need to create an account?</h3>
<p class="font-body-base text-on-surface-variant">Not to use it. You can simulate right now without signing up. An account (free) lets you save circuits to your profile.</p>
</div>
<!-- Q4 -->
<div class="bg-surface-container-low p-6 rounded-xl border border-outline-variant/20 soft-shadow">
<h3 class="font-headline-md text-lg text-on-surface mb-2">Which components are supported?</h3>
<p class="font-body-base text-on-surface-variant">Our library includes Microcontrollers (Arduino Uno), Passives (Resistors, LEDs, Buttons, Potentiometers), Sensors (Ultrasonic, Temperature, LDR), and Output devices (LCDs, OLEDs, Servos). We're adding more monthly — check our changelog.</p>
</div>
<!-- Q5 -->
<div class="bg-surface-container-low p-6 rounded-xl border border-outline-variant/20 soft-shadow">
<h3 class="font-headline-md text-lg text-on-surface mb-2">Can my teacher share a circuit for the whole class?</h3>
<p class="font-body-base text-on-surface-variant">Yes. Every circuit gets a shareable link. Students open it and get their own copy to modify.</p>
</div>
<!-- Q6 -->
<div class="bg-surface-container-low p-6 rounded-xl border border-outline-variant/20 soft-shadow">
<h3 class="font-headline-md text-lg text-on-surface mb-2">Is this better than the college lab?</h3>
<p class="font-body-base text-on-surface-variant">Different, not better. The lab gives you hands-on hardware experience you can't replace. This gives you unlimited practice time so you walk into that lab prepared.</p>
</div>
<!-- Q7 -->
<div class="bg-surface-container-low p-6 rounded-xl border border-outline-variant/20 soft-shadow">
<h3 class="font-headline-md text-lg text-on-surface mb-2">Does it work on mobile?</h3>
<p class="font-body-base text-on-surface-variant">The simulator is best on a laptop or desktop. The canvas and code editor work on tablets, but we recommend a keyboard for serious circuit building.</p>
</div>
</div>
</div>
</section><section class="py-24 border-t border-outline-variant/10 relative z-10 bg-primary text-on-primary">
<div class="max-w-container-max mx-auto px-margin-desktop text-center">
<h2 class="font-display-lg text-display-lg-mobile md:text-display-lg tracking-tight mb-4 text-on-primary">Your next lab practical starts now.</h2>
<p class="font-body-base text-lg mb-8 text-primary-fixed">
      (Not in the lab. Not after you buy a kit. Right now, in this tab.)
    </p>
<div class="max-w-2xl mx-auto mb-12">
<p class="font-body-base leading-relaxed text-primary-fixed">
        1,400+ engineering students practiced their circuits here last week. The only thing between you and your first simulation is one click.
      </p>
</div>
<div class="flex flex-col items-center gap-4">
<button class="font-bold px-12 py-5 rounded-lg flex items-center gap-2 hover:bg-secondary-fixed/90 transition-all soft-shadow text-lg bg-secondary-fixed text-on-secondary-fixed" onclick="window.location.href='/simulator'">
        Open Simulator — It's Free
        <span class="material-symbols-outlined">arrow_forward</span>
</button>
<p class="font-label-caps text-label-caps text-primary-fixed/80 uppercase tracking-widest mt-2">
            No Account Required
          </p>
</div>
</div>
</section>
<!-- Footer -->
<footer class="bg-surface-container-highest text-on-surface py-12 border-t border-outline-variant/20">
<div class="max-w-container-max mx-auto px-6 md:px-margin-desktop">
<div class="flex flex-col md:flex-row justify-between items-center gap-6">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-primary text-2xl" style="font-variation-settings: &quot;FILL&quot; 1;">bolt</span>
<span class="font-display-lg text-lg tracking-tighter text-on-surface">Oscilink</span>
</div>
<div class="flex items-center gap-8"><a class="font-body-base text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a><a class="font-body-base text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a><a class="font-body-base text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Contact Us</a></div>
</div>
<div class="mt-8 pt-8 border-t border-outline-variant/10 text-center">
<p class="font-body-base text-xs text-on-surface-variant">© 2026 Oscilink. All rights reserved.</p>
</div>
</div>
</footer>
  `;

  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}
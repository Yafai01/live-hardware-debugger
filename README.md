⚡ Live Hardware Debugger 

A sci-fi-grade, browser-powered, real-time hardware debugging dashboard.
Runs on Vite + React + WebSerial.
Speaks fluent JSON. Draws charts like Iron Man’s HUD.
Probably cooler than your lab equipment.

🔗 Live Demo: https://live-hardware-debugger.vercel.app/

🔥 Powered by Vercel
😎 Built by Yafai, the guy who doesn’t give up.

🧠 What is this thing?

This isn’t “another serial monitor.”

This is:

A real-time hardware analyzer

A command console

A live telemetry dashboard

A byte-level oscilloscope

A themeable control room UI

A JSON debugger

A Bond-villain-style monitoring panel

All running in your browser.
No apps. No installations. No excuses.

🎯 Why does it exist?

Because normal serial monitors are boring.
Because real engineers deserve shiny buttons.
Because debugging hardware should feel like hacking a spaceship, not reading a spreadsheet.

🚀 Features (aka “Why this is cooler than your old tools”)
💬 Serial Connection + Auto Reconnect

Connect to hardware over USB, even if the cable wiggles (looking at you, cheap CH340 boards).

🧪 Realtime Terminal

Color-coded logs

Timestamps

Download logs

JSON auto-detection

Works like a cyberpunk console

📈 Live Telemetry Charts

Temperature

RPM

Voltage

Anything your device spits out

80-frame rolling buffer

Smooth and fast

📡 Oscilloscope Mode

Turns raw serial bytes into a waveform.
Yes — bytes → waves.
Because why should analog guys have all the fun?

🎮 Macro Commands

One tap → your device obeys:

START

STOP

STATUS

JSON commands

Feels like controlling a drone / robot / reactor.
(we don’t judge your hobbies)

🎨 Themes

Pick your vibe:

🔥 Dark HUD

🌕 Light Mode

🟩 Matrix / Hacker Mode

Switch instantly. Stores your choice forever.
(A relationship more stable than your ex, honestly.)

⚙️ Settings Panel

Save baud rate

Auto reconnect

Chart smoothing

Oscilloscope style

Persistent via LocalStorage

Your dashboard. Your rules.

🛠️ Tech Stack That Makes It All Possible
Technology	Reason
Vite	Fast as lightning dev server
React	Components that don’t cry
Web Serial API	Talk to hardware from the browser
Chart.js	Sexy graphs
Vercel	Global deployment like a boss
📦 Installation (Local)
git clone https://github.com/Yafai01/live-hardware-debugger.git
cd live-hardware-debugger
npm install
npm run dev


Then open:

http://localhost:5173


Boom. You’re in.

🚀 Deployment

Already deployed at:
https://live-hardware-debugger.vercel.app/

To deploy your own:

npm run build
vercel --prod


Thanks to HTTPS, Web Serial works smoothly.

🔥 Example Arduino Firmware

Just upload the following to any Arduino / ESP board:

void setup() {
  Serial.begin(115200);
}

void loop() {
  float temp = 25 + random(-50, 50) * 0.01;
  int rpm = 3000 + random(-200, 200);

  Serial.print("{\"temp\":");
  Serial.print(temp,2);
  Serial.print(",\"rpm\":");
  Serial.print(rpm);
  Serial.println("}");

  delay(200);
}


Data shows up instantly on the dashboard.
Magic? No. Engineering? Yes.

🎛️ Folder Structure (Clean & Modular)
src/
│
├── main.jsx
├── App.jsx
├── index.css
├── themes/
│   ├── dark.css
│   ├── light.css
│   └── matrix.css
│
├── components/
│   ├── DevicePanel.jsx
│   ├── CommandMacros.jsx
│   ├── SettingsPanel.jsx
│   ├── Terminal.jsx
│   ├── LiveChart.jsx
│   └── Oscilloscope.jsx
│
└── lib/
    └── serial.js


Every part is plug-and-play.

👨‍💻 Author — Yafai

AIML student.
Builder of cool stuff.
Eats bugs for breakfast.
Doesn’t give up.
Writes code like it’s poetry.
Deploys like it’s destiny.

If Tony Stark had a cousin who loved hardware debugging…
yeah, it would be me.

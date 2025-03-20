<h1 align="center">
<!-- <picture>
  <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/512.webp" type="image/webp"  align="center">
  <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/512.gif" alt="🤩" width="75" height="75"  align="center">
</picture> -->
<picture>
  <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f6f8/512.webp" type="image/webp">
  <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f6f8/512.gif" alt="🛸" width="75" height="75"align="center">
</picture>
  Career Fair in Metaverse 
<picture>
  <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f6f8/512.webp" type="image/webp">
  <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f6f8/512.gif" alt="🛸" width="75" height="75"align="center">
</picture>
</h1>

---

<h1 align="center">
<picture>
  <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.webp" type="image/webp" align="center">
  <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.gif" alt="🚀" width="42" height="42" align="center">
</picture>
 Overview
<picture>
  <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.webp" type="image/webp" align="center">
  <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.gif" alt="🚀" width="42" height="42" align="center">
</picture>
</h1>

<p align="center"> <b>NexsuPlus</b> is an immersive virtual career fair experience set within the metaverse. The platform is designed to bridge the gap between job seekers and recruiters by offering an engaging, interactive, and dynamic 3D environment.</p>

<br/>

<h3>
<picture>
  <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.webp" type="image/webp"align="center">
  <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.gif" alt="✨" width="32" height="32"align="center">
</picture>
  Key Features
</h3>

- **3D Virtual Environment:** Users can explore a fully interactive multiplayer career fair environment, ask companies employers, and networking spaces.
- **Digital Twin Avatars:** Attendees can create personalized digital twins, representing themselves within the virtual space.
- **AI-Powered Systems:**
  <p>
    <picture>
    <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f3af/512.webp" type="image/webp"align="center">
    <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f3af/512.gif" alt="🎯" width="32" height="32"align="center">
    </picture> 
    <b>Job Recommendation System:</b> Suggests jobs and booths based on the user’s resume.
  </p> 
  <p>
    <picture>
    <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f916/512.webp" type="image/webp"align="center">
    <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f916/512.gif" alt="🤖" width="32" height="32"align="center">
    </picture> 
    <b>Chatbot Assistance:</b> Provides instant support and answers queries related to the event.
  </p>

- **Blockchain Integration:** Ensures secure data handling and supports digital authentication for event participation.
- **Voice Chat Communication:** Facilitates real-time networking, allowing participants to engage in seamless conversations during the event.

<br/>

<h3>
<picture>
  <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f30f/512.webp" type="image/webp"align="center">
  <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f30f/512.gif" alt="🌏" width="32" height="32"align="center">
</picture>
  Why NexusPlus?
</h3>

- **Enhanced Networking:** Break geographical barriers and connect with recruiters and professionals globally.
- **Personalized Experience:** Tailored recommendations and customizable avatars for an engaging experience.
- **Secure and Reliable:** Powered by blockchain for robust security and authentication.

---

<h1 align="center">
<picture>
  <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f6a7/512.webp" type="image/webp">
  <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f6a7/512.gif" alt="🚧" width="42" height="42"align="center">
</picture>
 Installation and Setup
<picture>
  <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f6a7/512.webp" type="image/webp">
  <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f6a7/512.gif" alt="🚧" width="42" height="42"align="center">
</picture>
</h1>

<br/>

Follow these steps to get the project up and running:

1. **Clone the repository:**

   ```Bash
   git clone https://github.com/3bdop/career-fair-metaverse.git
   ```

2. **Install the WebGL build:**

- [Install WebGL build](https://drive.google.com/file/d/1L4ULqhGlk11bPRumg6TibCMJKbgTXIbE/view?usp=drive_link).
- After installing the build, drag and drop the files in `/frontend/src/public/bt/`

3. **Install dependencies in frontend and run:**

   ```Bash
   cd frontend
   npm i
   npm run dev
   ```

4. **Install dependencies in backend and run:**

   ```Bash
   cd backend
   npm i
   npm run dev
   ```

   > **_Note:_** If nodemon not installed on your machine: `npm i -g nodemon`

## Python Model Development <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f40d/512.gif" alt="🐍" width="42" height="42" align='center'>:

Follow these steps to set up the Python environment for model development:

1. **Create a virtual environment:**

&emsp; For Windows:

```bash
cd backend/recommendation
python -m venv .venv
.\.venv\Scripts\activate.bat
```

&emsp; For Linux/macOS:

```bash
cd backend/recommendation
python -m venv .venv
source .venv/bin/activate
```

2.  **Install Python dependencies:**

```bash
pip install -r requirements.txt
```

3. **Run model:**

```Bash
python -m src.api.run_api
```

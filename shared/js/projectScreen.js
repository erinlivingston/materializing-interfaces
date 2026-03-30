import { navigateTo } from "./mobileApp.js";

let container = null;
let backBtn = null;

function onBack() {
  navigateTo("home");
}

export function initProject(el) {
  container = el;
  container.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "project-screen";
  wrap.innerHTML = `
    <div class="project-screen__inner">
      <div class="project-screen__kicker">Project</div>
      <h2 class="project-screen__title">Material Desktop</h2>
      <p class="project-screen__p">
        This is a placeholder page for the narrative content you’re starting to write.
        Add your project description, references, and “how to read the feed” here.
      </p>
      <p class="project-screen__p">
        The endless feed is generative: ad crops are separated into riso-like inks and layered
        over a paper surface. Mouse or stylus drag leaves a trail of small
        <a href="https://openmoji.org/" rel="noopener noreferrer" target="_blank">OpenMoji</a>
        stamps (curated set); they accumulate on a fixed layer like stickers on glass.
      </p>
      <p class="project-screen__attribution">
        Emoji graphics:
        <a href="https://openmoji.org/" rel="noopener noreferrer" target="_blank">OpenMoji</a>
        — open-source emoji project (HfG Schwäbisch Gmünd). License:
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="noopener noreferrer" target="_blank">CC&nbsp;BY-SA&nbsp;4.0</a>.
      </p>
      <div class="project-screen__hint">
        Tip: Use “Export PNG” on the feed when a pattern feels right.
      </div>
    </div>
  `;
  container.appendChild(wrap);

  backBtn = document.createElement("button");
  backBtn.className = "mobile-back-btn";
  backBtn.textContent = "←";
  backBtn.addEventListener("click", onBack);
  container.appendChild(backBtn);
}

export function destroyProject() {
  if (backBtn) backBtn.removeEventListener("click", onBack);
  if (container) container.innerHTML = "";
  container = null;
  backBtn = null;
}


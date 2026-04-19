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
      <div class="project-screen__kicker">the material feed</div>
      <p class="project-screen__p">
        You made it to the feed. Or maybe the feed made it to you — that's the question this screen is sitting with.
      </p>
      <p class="project-screen__p">
        The images scrolling past are real advertisements served to me on Instagram over ten days of ordinary use. Products I searched for, categories the algorithm inferred about me, sponsored content from accounts I never followed. I screenshotted each one, tagged it by what I felt it was selling — not the product, but the feeling the product was attached to. Cozy. Adventure. Self-care. Strength. The feed doesn't sell things. It sells dispositions.
      </p>
      <p class="project-screen__p">
        Those tags produce color. A JavaScript library models the behavior of risograph printing inks, each named for a specific drum loaded into a physical press — SEAFOAM, PAPRIKA, LAGOON, MIDNIGHT. Comfort becomes warm amber. Adventure becomes deep outdoor blue. The advertisements are processed through a dithering pipeline that removes their surface sheen and renders them in scattered dots, like a halftone print. The commodity is still there. Its finish is gone.
      </p>
      <p class="project-screen__p">
        The paper texture underneath is not a phone screen. It's an homage to the zine, the printed pamphlet, the fandom publication — the half-digital, half-not period of the internet when communities made physical things to circulate what platforms hadn't yet learned to monetize.
      </p>
      <p class="project-screen__p">
        The marks you leave by tapping stay on the surface while the feed scrolls beneath them. Trademark symbols, copyright glyphs, currency signs — the language of commercial content used to assert ownership and novelty, now yours to scatter wherever you want. The feed moves. The marks stay.
      </p>
      <p class="project-screen__p">
        Before you go back to the desktop: that transition you just made — from browser to feed, from output to input, from the thing you were doing to the break from the thing you were doing — that loop is what this project is about. One screen experience is always followed by another. You are anticipated before you arrive.
      </p>
      <p class="project-screen__p">
        Export the feed if something catches you. Take a piece of it with you. The algorithm would prefer you didn't.
      </p>
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

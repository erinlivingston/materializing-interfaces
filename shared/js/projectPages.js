/** Profile photos available for selection, with their riso-ink accent colours. */
export const PROFILE_PHOTO_STORAGE_KEY = "materialDesktopProfilePhoto";
export const DEFAULT_PROFILE_PHOTO_ID = "sara-cervera";
export const PROFILE_PHOTOS = [
  {
    id: "sara-cervera",
    src: "../assets/iconphotos/png/sara-cervera-BULkOCPQnmU-unsplash.png",
    risoColor: "#e05a5a",
  },
  {
    id: "stephanie-leblanc",
    src: "../assets/iconphotos/png/stephanie-leblanc-JLMEZxBcXCU-unsplash.png",
    risoColor: "#2bbcb0",
  },
  {
    id: "kara-eads",
    src: "../assets/iconphotos/png/kara-eads-zcVArTF8Frs-unsplash.png",
    risoColor: "#4e78d0",
  },
  {
    id: "filipe-cantador",
    src: "../assets/iconphotos/png/filipe-cantador-yuHbUrnOHe4-unsplash.png",
    risoColor: "#f08a2e",
  },
  {
    id: "didssph",
    src: "../assets/iconphotos/png/didssph-9uGrN7nYsEY-unsplash.png",
    risoColor: "#9060d0",
  },
  {
    id: "david-clode",
    src: "../assets/iconphotos/png/david-clode-iLwQIbWxv-s-unsplash.png",
    risoColor: "#48c888",
  },
];

export function readProfilePhotoSrc() {
  try {
    const id = localStorage.getItem(PROFILE_PHOTO_STORAGE_KEY);
    const found = PROFILE_PHOTOS.find((p) => p.id === id);
    return (found ?? PROFILE_PHOTOS[0]).src;
  } catch {
    return PROFILE_PHOTOS[0].src;
  }
}

/** Essays shown in the Start menu — sourced from essays.json. */
export const START_MENU_ESSAYS = [
  {
    title: "the desktop",
    excerpt:
      "Welcome to the material data desktop. A virtual art object-based world that subverts what we know of the personal computing interface, and asks the user to consider the interaction and the traces they leave in the browser and on the machine.",
    full: [
      "Welcome to the material data desktop. A virtual art object-based world that subverts what we know of the personal computing interface, and asks the user to consider the interaction and the traces they leave in the browser and on the machine.",
      "The desktop is made to feel a clean, efficient, neutral space. Its conventions are so defining, they\u2019ve become habitual, a visual language we speak without thinking. Here, those conventions are altered to encourage investigation, transformation, and most of all, silliness in the ways user interface (UI) defines us. Going for the muscle-memory close button opens another window. Clusters of blue folders vanish when clicked to open, menus pose existential questions instead of offering options.",
      "Every interaction with the interface is a small negotiation between the user and a system built, and re-built, before they arrived. This project asks you to slow down inside that negotiation. What could it mean to retrofit an interface with materiality? To re-negotiate its terms of use, and gain back senses we forfeit to the machine. These objects, the desktop, the browser, and the window, are already becoming artifacts. This is an invitation to notice what they assume, extract, and quietly decide on your behalf, before they disappear into the next version of themselves.",
    ].join("\n\n"),
  },
  {
    title: "input & output",
    excerpt:
      "Personal computing interfaces reflect inner consciousness and serve as intimate organizational pillars. We ask much of the browser. Input and output, user and machine.",
    full: [
      "Personal computing interfaces reflect inner consciousness and serve as intimate organizational pillars. We ask much of the browser. Input and output, user and machine. Our inquiries feel at times unique, others cheeky, but for those scraping and collecting them, our inputs fund the data economy. As D\u2019Ignazio and Klein describe in Data Feminism, \u201ctrivial actions are collected for profit, tiny actions combined with other actions to generate targeted advertisements.\u201d More importantly, data feminism is an approach that understands data as part of the problem and the solution.",
      "The power is in classification. As Gitelman writes in Raw Data is an Oxymoron, \u201cPower within aggregation is relational, data depends on hierarchy and imagining is always a classification that once in place is notoriously difficult to discern and analyze.\u201d Our inputs are valuable because they can be sorted, individual uniqueness is smoothed and ignored in the name of this aggregation.",
      "Data science names this the black box, a system of outputs you can observe, inputs you can trace, but interior logic that remains opaque. The value in collecting this information lies in the ability to predict, to feed the next browser, the next search, the next window. This is where extraction occurs, quietly, automatically, and at scale.",
    ].join("\n\n"),
  },
  {
    title: "the user",
    excerpt:
      "Personal computing has always been sold to us as a site of identity. This is the core of technocentric utopianism, the idea users can transcend in the digital space, and that the interface liberates.",
    full: [
      "Personal computing has always been sold to us as a site of identity. This is the core of technocentric utopianism, the idea users can transcend in the digital space, and that the interface liberates. Work and leisure convene around the same screen. The desktop organizes labor and desire in the same gestures.",
      "\u201cCognitariat\u201d describes contemporary knowledge workers whose intellectual output powers the digital economy. Autonomy quietly diminishes while \u201cproductivity\u201d metrics climb. The desktop is the site of this labor: a place where thinking is organized, produced, and extracted. Karl Marx wrote about the alienation of the worker from the products of their labor. This alienation only continues as web spaces evolve. Working from home, surveilled by your company during the day, then mined for your personal leisure data in supposed off hours.",
      "User interactions aggregated at the scale of exabytes is enough to let prediction capabilities equal our total consumption. You are anticipated before you arrive on the desktop and in the browser. The blurriness of user output-input with the machine, at nearly 24 hours a day, produces many things. But especially amnesia. Why was I here again? Menu designs on the material desktop mirror this tone using existential response instead of mindless content.",
    ].join("\n\n"),
  },
  {
    title: "the feed",
    excerpt:
      "The feed replaced the page. Infinite scroll was a design decision that became a condition \u2014 the collapse of consumer and producer made invisible.",
    full: [
      "The feed replaced the page. Infinite scroll was a design decision that became a condition \u2014 the collapse of consumer and producer made invisible, stitched into a gesture as natural as breathing.",
      "One screen experience is always followed by another. We are nudged through a number of different UI experiences: getting the computer to do the serious things, like paying a bill, and grabbing the feed \u2014 on mobile or another tab \u2014 to take a break from the thing you worked so hard on.",
      "We don\u2019t go to the feed for anything in particular, and the feed gives us amnesia, which we carry back to the browser. Why was I here again? This amnesia fed the existential writing in the menus of the material desktop windows. These questions are also reflected in the scraped components of browser history \u2014 prompts and grasps, the product of an ecosystem of search.",
      "That loop has a second screen. \u2192",
    ].join("\n\n"),
  },
];

const START_MENU_HTML = `
<div class="material-start-menu" aria-label="Start menu">
  <div class="material-sm-header">
    <button type="button" class="material-sm-avatar" id="material-sm-avatar" aria-label="Show display settings"><img class="profile-avatar-img material-sm-avatar__img" src="../assets/iconphotos/png/sara-cervera-BULkOCPQnmU-unsplash.png" alt="" /></button>
    <div class="material-sm-title">the material data desktop</div>
  </div>
  <div class="material-sm-body">
    <div class="material-sm-col-left" id="material-sm-col-left">
      <div class="material-sm-col-header">
        <span class="material-sm-col-label">start menu</span>
        <button type="button" class="material-sm-collapse-btn" id="material-sm-col-btn" aria-label="Collapse menu">&#8249;</button>
      </div>
      <div class="material-sm-section-label">essays</div>
      <div class="material-sm-toc-item material-sm-toc-active" role="button" tabindex="0" data-essay-index="0">
        <div class="material-sm-toc-name">the desktop</div>
      </div>
      <div class="material-sm-toc-item" role="button" tabindex="0" data-essay-index="1">
        <div class="material-sm-toc-name">input &amp; output</div>
      </div>
      <div class="material-sm-toc-item" role="button" tabindex="0" data-essay-index="2">
        <div class="material-sm-toc-name">the user</div>
      </div>
      <div class="material-sm-toc-item" role="button" tabindex="0" data-essay-index="3">
        <div class="material-sm-toc-name">the feed</div>
      </div>
      <div class="material-sm-section-label material-sm-section-label--spaced">see also</div>
      <a class="material-sm-see-item" href="https://www.dear-data.com/" target="_blank" rel="noopener noreferrer">
        <span class="material-sm-see-ico" aria-hidden="true"></span>
        <span>Dear Data</span>
      </a>
      <a class="material-sm-see-item" href="https://mitpress.mit.edu/9780262043298/data-feminism/" target="_blank" rel="noopener noreferrer">
        <span class="material-sm-see-ico" aria-hidden="true"></span>
        <span>Data Feminism</span>
      </a>
      <a class="material-sm-see-item" href="https://en.wikipedia.org/wiki/Donna_Haraway" target="_blank" rel="noopener noreferrer">
        <span class="material-sm-see-ico" aria-hidden="true"></span>
        <span>Haraway</span>
      </a>
      <a class="material-sm-see-item" href="https://mitpress.mit.edu/9780262525352/raw-data-is-an-oxymoron/" target="_blank" rel="noopener noreferrer">
        <span class="material-sm-see-ico" aria-hidden="true"></span>
        <span>Raw Data is an Oxymoron</span>
      </a>
      <a class="material-sm-see-item" href="https://www.shannonmattern.org/" target="_blank" rel="noopener noreferrer">
        <span class="material-sm-see-ico" aria-hidden="true"></span>
        <span>Shannon Mattern</span>
      </a>
      <div class="material-sm-see-divider"></div>
      <a class="material-sm-see-item" href="#" target="_blank" rel="noopener noreferrer">
        <span class="material-sm-see-ico material-sm-see-ico--lock" aria-hidden="true"></span>
        <span>GitHub repo</span>
      </a>
      <a class="material-sm-see-item" href="#" target="_blank" rel="noopener noreferrer">
        <span class="material-sm-see-ico material-sm-see-ico--sketch" aria-hidden="true"></span>
        <span>p5.js sketches</span>
      </a>
    </div>
    <div class="material-sm-col-main">
      <div class="material-sm-preview-header">
        <div class="material-sm-preview-essay-label" id="material-sm-p-label">essay</div>
        <div class="material-sm-preview-title" id="material-sm-p-title">the desktop</div>
      </div>
      <div class="material-sm-essay-body" id="material-sm-essay-body"></div>
    </div>
  </div>
  <div class="material-sm-footer">
    <button type="button" class="material-sm-footer-btn" data-start-menu-log-off>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" stroke-width="1.2"/>
        <line x1="5" y1="1" x2="5" y2="5" stroke="currentColor" stroke-width="1.2"/>
      </svg>
      log off
    </button>
  </div>
</div>
`;

const PAGES = [
  {
    id: "start",
    title: "Start menu",
    html: START_MENU_HTML,
  },
];

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Wire TOC, full essay pane, avatar → display panel, and column collapse.
 * Call after the Start page HTML is in the DOM.
 * @param {HTMLElement} rootEl — .content-window__body--project
 */
export function initMaterialStartMenu(rootEl) {
  const shell = rootEl.querySelector(".material-start-menu");
  if (!shell) return;

  const colLeft = shell.querySelector("#material-sm-col-left");
  const colBtn = shell.querySelector("#material-sm-col-btn");
  const pLabel = shell.querySelector("#material-sm-p-label");
  const pTitle = shell.querySelector("#material-sm-p-title");
  const essayBody = shell.querySelector("#material-sm-essay-body");
  const avatarBtn = shell.querySelector("#material-sm-avatar");

  if (!colLeft || !colBtn || !pLabel || !pTitle || !essayBody) return;

  let leftOpen = true;

  /* Sync wallpaper radio buttons with stored choice, reading localStorage directly
     so projectPages.js stays self-contained (no import from overlay.js). */
  function syncDisplayRadios() {
    let choice = "landscape";
    try {
      const stored = localStorage.getItem("desktop-bg");
      if (stored === "ombre") choice = "ombre";
    } catch {}
    essayBody.querySelectorAll('input[name="desktop-bg"]').forEach((inp) => {
      inp.checked = inp.value === choice;
    });
  }

  function showEssay(i) {
    const e = START_MENU_ESSAYS[i];
    if (!e) return;
    pLabel.textContent = "essay";
    pTitle.textContent = e.title;
    essayBody.innerHTML = e.full
      .split(/\n\n+/)
      .map((para) => `<p class="material-sm-essay-p">${escapeHtml(para.trim())}</p>`)
      .join("");
    shell.querySelectorAll(".material-sm-toc-item").forEach((el, idx) => {
      el.classList.toggle("material-sm-toc-active", idx === i);
    });
  }

  function showDisplay() {
    pLabel.textContent = "display";
    pTitle.textContent = "Profile & Wallpaper";

    let currentId = DEFAULT_PROFILE_PHOTO_ID;
    try {
      const stored = localStorage.getItem(PROFILE_PHOTO_STORAGE_KEY);
      if (stored) currentId = stored;
    } catch {}

    const profileOptionsHTML = PROFILE_PHOTOS.map(
      (photo) => `
        <label class="profile-option${photo.id === currentId ? " profile-option--selected" : ""}">
          <input type="radio" name="profile-photo" value="${photo.id}"${photo.id === currentId ? " checked" : ""} />
          <div class="profile-option__thumb" style="--riso-ink:${photo.risoColor}">
            <img src="${photo.src}" alt="" />
          </div>
        </label>`
    ).join("");

    essayBody.innerHTML = `
      <p class="display-section-label">Profile photo</p>
      <div class="profile-photo-grid">${profileOptionsHTML}</div>
      <fieldset class="display-wallpaper-fieldset">
        <legend class="project-start-display__fieldset-legend">Background</legend>
        <label class="project-start-display__option">
          <input type="radio" name="desktop-bg" value="landscape" />
          <span>Landscape</span>
        </label>
        <label class="project-start-display__option">
          <input type="radio" name="desktop-bg" value="ombre" />
          <span>Ombre</span>
        </label>
      </fieldset>
    `;
    syncDisplayRadios();

    essayBody.querySelectorAll('input[name="profile-photo"]').forEach((inp) => {
      inp.addEventListener("change", () => {
        if (!inp.checked) return;
        const photo = PROFILE_PHOTOS.find((p) => p.id === inp.value);
        if (!photo) return;
        try {
          localStorage.setItem(PROFILE_PHOTO_STORAGE_KEY, inp.value);
        } catch {}
        document.querySelectorAll(".profile-avatar-img").forEach((img) => {
          img.src = photo.src;
        });
        essayBody.querySelectorAll(".profile-option").forEach((el) => {
          el.classList.toggle(
            "profile-option--selected",
            el.querySelector("input")?.value === inp.value
          );
        });
        document.dispatchEvent(
          new CustomEvent("profilePhotoChange", { detail: { src: photo.src } })
        );
      });
    });

    shell.querySelectorAll(".material-sm-toc-item").forEach((el) => {
      el.classList.remove("material-sm-toc-active");
    });
  }

  shell.querySelectorAll(".material-sm-toc-item").forEach((el) => {
    const idx = Number(el.dataset.essayIndex);
    if (!Number.isFinite(idx)) return;
    el.addEventListener("click", () => showEssay(idx));
    el.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        showEssay(idx);
      }
    });
  });

  if (avatarBtn) {
    const avatarImg = avatarBtn.querySelector(".profile-avatar-img");
    if (avatarImg) avatarImg.src = readProfilePhotoSrc();
    /* Prevent pointer events from bubbling to the header close-on-tap handler. */
    avatarBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
    avatarBtn.addEventListener("pointerup", (e) => e.stopPropagation());
    avatarBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showDisplay();
    });
  }

  colBtn.addEventListener("click", () => {
    leftOpen = !leftOpen;
    colLeft.classList.toggle("material-sm-col-left--collapsed", !leftOpen);
    colBtn.innerHTML = leftOpen ? "&#8249;" : "&#8250;";
  });

  shell.querySelectorAll("a.material-sm-see-item").forEach((a) => {
    if (a.getAttribute("href") === "#") {
      a.addEventListener("click", (e) => e.preventDefault());
    }
  });

  showEssay(0);
}

export function getProjectPageById(id) {
  if (!id) return null;
  return PAGES.find((p) => p.id === id) || null;
}

export function getBuildProjectPageById(_id) {
  return null;
}

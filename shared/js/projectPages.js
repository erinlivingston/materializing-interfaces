const PAGES = [
  {
    id: "start",
    title: "Start",
    html: `
      <h2>Material Desktop</h2>
      <p>
        This desktop is a reading system made out of images that pretend to be windows.
        Clicking the top-left controls refuses closure: it opens more surfaces.
      </p>
      <p>
        Try opening a few windows until paper starts showing up. The “paper” isn’t a background—it's another kind of window.
      </p>
      <p>
        Suggested paths: <a href="#" data-project-link="interface_as_theory">Interface as theory</a>,
        <a href="#" data-project-link="nonlinear_navigation">Nonlinear navigation</a>,
        <a href="#" data-project-link="the_window_as_metaphor">The window as metaphor</a>.
      </p>
    `,
  },
  {
    id: "interface_as_theory",
    title: "Interface as theory",
    html: `
      <h2>Interface as theory</h2>
      <p>
        The interface is never neutral. It is an argument about what counts as action, what counts as content,
        and what counts as noise. Here the “argument” is made from screenshots: an inherited grammar of tabs,
        close buttons, and search boxes re-staged as collage.
      </p>
      <p>
        A button that should close becomes a generator. A window that should contain becomes an invitation to spill.
        The system is readable as a theory of attention: not a straight line, but a set of surfaces you keep returning to.
      </p>
      <p>
        Continue: <a href="#" data-project-link="nonlinear_navigation">Nonlinear navigation</a> or
        <a href="#" data-project-link="paper_as_window">Paper as window</a>.
      </p>
    `,
  },
  {
    id: "nonlinear_navigation",
    title: "Nonlinear navigation",
    html: `
      <h2>Nonlinear navigation</h2>
      <p>
        Nonlinear doesn’t mean random—it means the path is authored as a set of affordances rather than a sequence.
        The same few gestures can lead to different readings depending on what is already open.
      </p>
      <p>
        Here, “non-duplicated” windows matter: once something is present, the system nudges you elsewhere.
        Navigation becomes a constraint that produces variety.
      </p>
      <p>
        Continue: <a href="#" data-project-link="the_window_as_metaphor">The window as metaphor</a> or
        <a href="#" data-project-link="interface_as_theory">Interface as theory</a>.
      </p>
    `,
  },
  {
    id: "paper_as_window",
    title: "Paper as window",
    html: `
      <h2>Paper as window</h2>
      <p>
        Paper is a technology of framing. It’s a surface that suggests permanence, but it’s also a unit of circulation:
        pages, scraps, receipts, notes. When paper becomes a “window,” the desktop’s promise of control gets softened
        into texture and drift.
      </p>
      <p>
        The drop shadow makes it behave like the other windows, but the image refuses to behave like an application.
        It’s just a material presence you can stack.
      </p>
      <p>
        Continue: <a href="#" data-project-link="the_window_as_metaphor">The window as metaphor</a>.
      </p>
    `,
  },
  {
    id: "the_window_as_metaphor",
    title: "The window as metaphor",
    html: `
      <h2>The window as metaphor</h2>
      <p>
        “Window” describes an architectural fantasy: a clean rectangle that gives access to elsewhere.
        On a desktop, the window is also governance—layers, focus, permission to speak.
      </p>
      <p>
        When your windows are images of windows, the metaphor folds back on itself. The system becomes self-descriptive:
        a desktop that points at “desktopness” as a cultural object.
      </p>
      <p>
        Continue: <a href="#" data-project-link="start">Start</a> or
        <a href="#" data-project-link="paper_as_window">Paper as window</a>.
      </p>
    `,
  },
  {
    id: "github_repository",
    title: "Repository / process",
    html: `
      <h2>Repository / process</h2>
      <p>
        This window stands in for the codebase as an interface object: a fake editor that opens into “how it’s made.”
      </p>
      <p>
        Add your repo link here when you’re ready, or treat this as a changelog / notes surface.
      </p>
    `,
  },
];

export function getProjectPageById(id) {
  if (!id) return null;
  return PAGES.find((p) => p.id === id) || null;
}

